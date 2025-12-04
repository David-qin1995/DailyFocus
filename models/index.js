const { Sequelize, DataTypes } = require("sequelize");

// 从环境变量中读取数据库配置
const { MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_ADDRESS = "" } = process.env;

const [host, port] = MYSQL_ADDRESS.split(":");

const sequelize = new Sequelize("ai_assistant", MYSQL_USERNAME, MYSQL_PASSWORD, {
  host,
  port,
  dialect: "mysql",
  logging: false,
  timezone: '+08:00',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// 用户表
const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  openid: {
    type: DataTypes.STRING(128),
    unique: true,
    allowNull: false,
    comment: '微信openid'
  },
  nickname: {
    type: DataTypes.STRING(100),
    comment: '用户昵称'
  },
  preferences: {
    type: DataTypes.JSON,
    defaultValue: {
      replyTone: 'gentle',
      analysisFrequency: 'weekly',
      languageStyle: 'concise'
    },
    comment: '用户偏好设置'
  },
  lastActiveAt: {
    type: DataTypes.DATE,
    comment: '最后活跃时间'
  }
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    { fields: ['openid'] }
  ]
});

// 会话表
const Conversation = sequelize.define("Conversation", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  title: {
    type: DataTypes.STRING(200),
    defaultValue: '默认对话',
    comment: '会话标题'
  },
  meta: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: '会话元数据'
  }
}, {
  tableName: 'conversations',
  timestamps: true,
  indexes: [
    { fields: ['userId'] }
  ]
});

// 消息表
const Message = sequelize.define("Message", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  conversationId: {
    type: DataTypes.INTEGER,
    comment: '会话ID'
  },
  role: {
    type: DataTypes.ENUM('user', 'assistant'),
    allowNull: false,
    comment: '消息角色'
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    comment: '消息内容'
  },
  meta: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: '消息元数据(主题、情绪等)'
  }
}, {
  tableName: 'messages',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'createdAt'] },
    { fields: ['conversationId'] }
  ]
});

// 分析报告表
const AnalysisReport = sequelize.define("AnalysisReport", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  periodType: {
    type: DataTypes.ENUM('weekly', 'monthly', 'custom'),
    defaultValue: 'weekly',
    comment: '分析周期类型'
  },
  startAt: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '分析开始时间'
  },
  endAt: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '分析结束时间'
  },
  summary: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: '分析结果摘要'
  },
  rawModelInfo: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: '模型原始信息'
  }
}, {
  tableName: 'analysis_reports',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'createdAt'] }
  ]
});

// 用户画像表
const UserProfile = sequelize.define("UserProfile", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    unique: true,
    allowNull: false,
    comment: '用户ID'
  },
  traits: {
    type: DataTypes.JSON,
    defaultValue: {
      personality: [],
      abilities: [],
      values: []
    },
    comment: '特质评分'
  },
  longTermPatterns: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '长期模式'
  },
  historySnapshots: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '历史快照'
  }
}, {
  tableName: 'user_profiles',
  timestamps: true,
  indexes: [
    { fields: ['userId'] }
  ]
});

// 定义关联关系
User.hasMany(Conversation, { foreignKey: 'userId' });
User.hasMany(Message, { foreignKey: 'userId' });
User.hasMany(AnalysisReport, { foreignKey: 'userId' });
User.hasOne(UserProfile, { foreignKey: 'userId' });

Conversation.belongsTo(User, { foreignKey: 'userId' });
Conversation.hasMany(Message, { foreignKey: 'conversationId' });

Message.belongsTo(User, { foreignKey: 'userId' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId' });

AnalysisReport.belongsTo(User, { foreignKey: 'userId' });
UserProfile.belongsTo(User, { foreignKey: 'userId' });

// 数据库初始化方法
async function init() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 同步所有模型
    await sequelize.sync({ alter: true });
    console.log('数据库模型同步完成');
    
    return true;
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  init,
  User,
  Conversation,
  Message,
  AnalysisReport,
  UserProfile
};

