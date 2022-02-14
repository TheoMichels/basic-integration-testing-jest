const Router = require("koa-router")
const { ObjectId } = require("mongodb")

const router = Router({ prefix: "/todos" })
const { getDB } = require("./database")

router
    .get("/", listTodos)
    .post("/", createTodo)
    .put("/:id", updateTodo)
    .del("/test", deleteTodo)

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
    const urlParams = ctx.request

    console.log(urlParams)

    const id = urlParams.get("id")

    console.log(id)

    const result = await getDB().collection("todos").deleteOne({"_id" : ObjectId(id)})

    ctx.body = { id: result.insertedId }
}

async function updateTodo (ctx) {
    // TODO
}


createTodo()

//module.exports = router
