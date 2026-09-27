const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Loads a document by :paramName and guarantees it belongs to req.user,
// attaching it to req[attachAs]. Keeps every resource controller from
// re-implementing the same ownership check.
function loadOwnedDoc(Model, { paramName = 'id', attachAs = 'doc', notFoundMessage } = {}) {
  return asyncHandler(async (req, res, next) => {
    const id = req.params[paramName];
    const doc = await Model.findOne({ _id: id, owner: req.user._id });
    if (!doc) {
      throw ApiError.notFound(notFoundMessage || `${Model.modelName} not found`);
    }
    req[attachAs] = doc;
    next();
  });
}

module.exports = loadOwnedDoc;
