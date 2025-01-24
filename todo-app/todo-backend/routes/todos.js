const express = require("express");
const { Todo } = require("../mongo");
const router = express.Router();
const { getAsync, setAsync, incrAsync } = require("../redis/index")

/* GET todos listing. */
router.get("/", async (_, res) => {
  const todos = await Todo.find({});
  res.send(todos);
});

/* POST todo to listing. */
router.post("/", async (req, res) => {
  const todo = await Todo.create({
    text: req.body.text,
    done: false,
  });

  await incrAsync('todo_counter');

  res.send(todo);
});

/* GET statistics. */
router.get("/statistics", async (_, res) => {
  const count = await getAsync('todo_counter') || 0;
  res.json({"added_todos": count})
});

const singleRouter = express.Router();

const findByIdMiddleware = async (req, res, next) => {
  const { id } = req.params;
  req.todo = await Todo.findById(id);
  if (!req.todo) return res.sendStatus(404);

  next();
};

/* DELETE todo. */
singleRouter.delete("/", async (req, res) => {
  await req.todo.delete();
  res.sendStatus(200);
});

/* GET todo. */
singleRouter.get("/", async (req, res) => {
  res.send(req.todo);
});

/* PUT todo. */
singleRouter.put("/", async (req, res) => {
  const updatedTodo = await Todo.findByIdAndUpdate(req.todo.id, req.body, {
    new: true,
  });
  res.send(updatedTodo);
});

router.use("/:id", findByIdMiddleware, singleRouter);

module.exports = router;
