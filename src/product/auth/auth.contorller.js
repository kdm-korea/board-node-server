import userService from '../user/user.service';
import authService from './auth.service';

const execCreateAccessToken = async (req, res) => {
  await userService
    .findUserById(req.user.id)
    .then((user) => authService.createAccessToken(user))
    .then((accessToken) => res.json({ accesstoken: accessToken }))
    .catch((error) => res.status(401).json({ message: error.message }));
};

export default { execCreateAccessToken };