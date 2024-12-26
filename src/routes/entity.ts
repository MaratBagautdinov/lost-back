import { A_CREATE, A_DELETE, A_GET_LIST, A_GET_ONE, A_UPDATE } from "../config/constants";
import controllers_default from "../controllers/entity";
import controllers_order from "../controllers/exceptions/order";
import controllers_quest from "../controllers/exceptions/quest";
import controllers_order_actor_percent from "../controllers/exceptions/order_actor_percent";
import controllers_quest_slots from "../controllers/exceptions/quest_slots";
import express from 'express';
const router = express.Router();
const controllers = (req: express.Request): typeof controllers_default => {
	if (!req.params.entity_id) {
		throw Error('Entity not found')
	}
	switch (req.params.entity_id) {
		case 'order':
			return controllers_order
		case 'quest':
			return controllers_quest
		case 'order_actor_percent':
			return controllers_order_actor_percent
		case 'quest_slots':
			return controllers_quest_slots
		default:
			return controllers_default
	}
}
router.post(`/:entity_id${A_GET_LIST}`,
	(
		req,
		res
	) => controllers(req).list(req, res))
router.post(`/:entity_id${A_CREATE}`,
	(
		req,
		res
	) => controllers(req).create(req, res))
router.put(`/:entity_id${A_UPDATE}/:id`,
	(
		req,
		res
	) => controllers(req).update(req, res))
router.get(`/:entity_id${A_GET_ONE}/:id`,
	(
		req,
		res
	) => controllers(req).one(req, res))
router.delete(`/:entity_id${A_DELETE}/:id`,
	(
		req,
		res
	) => controllers(req).delete(req, res))
export default router;
