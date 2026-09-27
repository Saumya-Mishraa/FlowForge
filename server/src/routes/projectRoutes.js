const express = require('express');
const projectController = require('../controllers/projectController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const loadOwnedDoc = require('../middleware/loadOwnedDoc');
const { projectValidators } = require('../utils/validators/projectValidators');
const { Project } = require('../models');

const router = express.Router();

router.use(requireAuth);

router.get('/', projectController.listProjects);
router.post('/', projectValidators, validate, projectController.createProject);

router.get('/:id', loadOwnedDoc(Project, { notFoundMessage: 'Project not found' }), projectController.getProject);
router.patch(
  '/:id',
  loadOwnedDoc(Project, { notFoundMessage: 'Project not found' }),
  projectValidators,
  validate,
  projectController.updateProject
);
router.delete(
  '/:id',
  loadOwnedDoc(Project, { notFoundMessage: 'Project not found' }),
  projectController.deleteProject
);

module.exports = router;
