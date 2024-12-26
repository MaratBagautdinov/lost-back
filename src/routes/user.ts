import { A_CREATE, A_DELETE, A_GET_LIST, A_GET_ONE, A_UPDATE, A_LOGIN, A_GET_AUTH } from "../config/constants";
import controllers_user from "../controllers/user";
import express from 'express';
const router = express.Router();
router.post(A_LOGIN, controllers_user.login)
router.post(A_GET_AUTH, controllers_user.auth)
router.post(`${A_GET_LIST}`, controllers_user.list)
router.post(`${A_CREATE}`, controllers_user.create)
router.put(`${A_UPDATE}/:id`, controllers_user.update)
router.get(`${A_GET_ONE}/:id`, controllers_user.one)
router.delete(`${A_DELETE}/:id`, controllers_user.delete)

export default router;
