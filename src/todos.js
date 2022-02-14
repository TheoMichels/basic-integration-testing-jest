const Router = require("koa-router")
const { ObjectId } = require("mongodb")

const router = Router({ prefix: "/todos" })
const { getDB } = require("./database")

router
    .get("/", listTodos)
    .post("/", createTodo)
    .put("/:id", updateTodo)
    .del("/:id", deleteTodo)

async function listTodos (ctx) {
    const todos = await getDB()
        .collection("todos")
        .find({})
        .sort({ _id: 1 })
        .toArray()

    ctx.body = todos
}

async function createTodo (ctx) {
    const title = ctx.request.body.title

    if (title === null || title === undefined || title == "") {
        ctx.status = 422
        ctx.body = { errorMsg: "Missing parameter 'title'" }
    } else {
        const result = await getDB().collection("todos").insertOne({
            title,
            completed: false,
            createdAt: new Date(),
            updatedAt: new Date()
        })

        ctx.body = { id: result.insertedId }
    }
}

async function deleteTodo (ctx) {
    const id = ctx.request.params.id

    const result = await getDB().collection("todos").deleteOne({"_id" : ObjectId(id)})

    ctx.body = { id: result.insertedId }
}

async function updateTodo (ctx) {
    const id = ctx.request.params.id

    const title = ctx.request.body.title
    const completed = ctx.request.body.completed

    if ((title === null || title === undefined || title == "") & (completed === null || completed === undefined || completed == "")) {
        ctx.status = 422
        ctx.body = { errorMsg: "Must have at least one parameter updated" }
    }
    else if ((title !== null || title !== undefined || title != "") & (completed === null || completed === undefined || completed == "")) {
        const result = await getDB().collection("todos").updateOne(
            {"_id" : ObjectId(id)},
            {$set: { "title" : title}}
        )        
        ctx.body = { id: result.insertedId }
    }
    else if ((title === null || title === undefined || title == "") & (completed !== null || completed !== undefined || completed != "")) {
        const result = await getDB().collection("todos").updateOne(
            {"_id" : ObjectId(id)},
            {$set: { "completed" : Boolean(completed)}}
        )        
        ctx.body = { id: result.insertedId }
    }
    else {
        const result = await getDB().collection("todos").updateOne(
            {"_id" : ObjectId(id)},
            {$set: { "title" : title, "completed" : Boolean(completed)}}
        )        
        ctx.body = { id: result.insertedId }
    }
}

module.exports = router
