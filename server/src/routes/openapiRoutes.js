const express = require('express');
const { body } = require('express-validator');
const openapiController = require('../controllers/openapiController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(requireAuth);

router.post('/parse', [body('specText').notEmpty()], validate, openapiController.parseSpec);
router.post(
  '/import',
  [body('project').isMongoId(), body('specText').notEmpty()],
  validate,
  openapiController.importSpec
);

module.exports = router;
