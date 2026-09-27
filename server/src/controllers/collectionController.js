const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { Collection, ApiRequest, Project } = require('../models');

async function assertProjectOwned(projectId, userId) {
  const project = await Project.findOne({ _id: projectId, owner: userId });
  if (!project) throw ApiError.notFound('Project not found');
  return project;
}

const listCollections = asyncHandler(async (req, res) => {
  const { project } = req.query;
  if (!project) throw ApiError.badRequest('project query param is required');
  await assertProjectOwned(project, req.user._id);

  const collections = await Collection.find({ project, owner: req.user._id }).sort({ createdAt: 1 });
  res.json({ success: true, data: { collections } });
});

const createCollection = asyncHandler(async (req, res) => {
  const { project, name, description } = req.body;
  await assertProjectOwned(project, req.user._id);

  const collection = await Collection.create({
    project,
    owner: req.user._id,
    name,
    description,
  });
  res.status(201).json({ success: true, data: { collection } });
});

const updateCollection = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (name !== undefined) req.doc.name = name;
  if (description !== undefined) req.doc.description = description;
  await req.doc.save();
  res.json({ success: true, data: { collection: req.doc } });
});

const duplicateCollection = asyncHandler(async (req, res) => {
  const source = req.doc;
  const copy = await Collection.create({
    project: source.project,
    owner: req.user._id,
    name: `${source.name} (copy)`,
    description: source.description,
    folders: source.folders.map((f) => ({ name: f.name })),
  });

  const requests = await ApiRequest.find({ collection: source._id });
  if (requests.length) {
    const folderIdMap = new Map();
    source.folders.forEach((f, i) => folderIdMap.set(f._id.toString(), copy.folders[i]?._id));

    await ApiRequest.insertMany(
      requests.map((r) => ({
        project: r.project,
        collection: copy._id,
        folderId: r.folderId ? folderIdMap.get(r.folderId.toString()) || null : null,
        owner: req.user._id,
        name: r.name,
        description: r.description,
        method: r.method,
        url: r.url,
        params: r.params,
        headers: r.headers,
        auth: r.auth,
        body: r.body,
      }))
    );
  }

  res.status(201).json({ success: true, data: { collection: copy } });
});

const deleteCollection = asyncHandler(async (req, res) => {
  await ApiRequest.deleteMany({ collection: req.doc._id });
  await req.doc.deleteOne();
  res.json({ success: true, message: 'Collection deleted' });
});

const addFolder = asyncHandler(async (req, res) => {
  req.doc.folders.push({ name: req.body.name });
  await req.doc.save();
  res.status(201).json({ success: true, data: { collection: req.doc } });
});

const renameFolder = asyncHandler(async (req, res) => {
  const folder = req.doc.folders.id(req.params.folderId);
  if (!folder) throw ApiError.notFound('Folder not found');
  folder.name = req.body.name;
  await req.doc.save();
  res.json({ success: true, data: { collection: req.doc } });
});

const deleteFolder = asyncHandler(async (req, res) => {
  const folder = req.doc.folders.id(req.params.folderId);
  if (!folder) throw ApiError.notFound('Folder not found');
  folder.deleteOne();
  await req.doc.save();
  await ApiRequest.updateMany(
    { collection: req.doc._id, folderId: req.params.folderId },
    { $set: { folderId: null } }
  );
  res.json({ success: true, data: { collection: req.doc } });
});

module.exports = {
  listCollections,
  createCollection,
  updateCollection,
  duplicateCollection,
  deleteCollection,
  addFolder,
  renameFolder,
  deleteFolder,
};
