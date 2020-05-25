import db from '../../config/mariadb.config';
import crypto from '../../lib/pwEnoding/crpytoEncoding';
import authService from '../auth/auth.service';

const findUserById = async (userId) => {
  return db.User.findByPk(userId).then((user) => {
    if (user !== null) {
      return user;
    }
    throw new Error(`없는 일련번호입니다.`);
  });
};

const findUserByEmail = async (userEmail) => {
  return db.User.findOne({
    raw: true,
    where: { email: userEmail },
  }).then((user) => {
    if (user !== null) {
      return user;
    }
    throw new Error('이메일이 일치하는 유저가 없습니다.');
  });
};

const chkNotExistEamil = async (inputEmail) => {
  return db.User.findAndCountAll({
    raw: true,
    where: { email: inputEmail },
  }).then((reduplicate) => {
    if (reduplicate.count === 0) {
      return true;
    }
    throw new Error('Already have same email');
  });
};

const comparePassword = async (user, password) => {
  if (await crypto.comparePassword(password, user.salt, user.password)) {
    return user;
  }
  throw new Error('No Match Password');
};

const createUser = async (data) => {
  const record = data;
  const hashPassword = await crypto.saltHashEncoding(data.password);

  record.password = hashPassword.key;
  record.salt = hashPassword.salt;

  return db.User.create(record);
};

const updatePw = async (user, inputPw) => {
  const authUser = await db.User.findOne({
    where: { id: user.id },
  });
  const hashPassword = await crypto.saltHashEncoding(inputPw);

  authUser.password = hashPassword.key;
  authUser.salt = hashPassword.salt;
  authUser.reload();
  return true;
};

const execComparePassword = async (id, password) => {
  findUserById(id).then((user) => comparePassword(user, password));
};

const execUpdatePw = async (dto) => {
  await findUserById(dto.user.id)
    .then((user) => comparePassword(user, dto.password))
    .then((user) => updatePw(user, dto.password));
};

const execSignUp = async (body) => {
  return chkNotExistEamil(body.email)
    .then(() => createUser(body))
    .then((user) => user.id);
};

const execSignIn = async (body) => {
  return findUserByEmail(body.email)
    .then((user) => comparePassword(user, body.password))
    .then((user) => authService.createTokens(user))
    .then((token) => token);
};

const execSignOut = async (body) => {
  // redis에 accessToken을 저장하여 접근을 제한한다.
  // 토큰을 어떻게 처리할지에 대해 고민해봐야 함
};

const execUserInfo = async (userId) => {
  db.User.findOne({
    attributes: ['name', 'email', 'permission'],
    where: {
      id: userId,
    },
  });
};

const execDeleteUser = async (id, password) => {
  execComparePassword(id, password)
    // 토큰을 어떻게 처리할지에 대해 고민해봐야 함
    .then(() => 'success');
};

export default {
  execUserInfo,
  execComparePassword,
  execSignUp,
  execSignIn,
  execSignOut,
  execDeleteUser,
  execUpdatePw,
  findUserById,
  findUserByEmail,
  comparePassword,
  chkNotExistEamil,
};
