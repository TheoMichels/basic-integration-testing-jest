const { ObjectId } = require("mongodb")
const request = require("supertest")
const { query } = require("koa/lib/request")

const app = require("../src/app")
const { connectToDB, closeConnection, getDB } = require("../src/database")

const baseUrl = "/todos"

beforeAll(async () => {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
    const MONGODB_DB = process.env.MONGODB_DB || 'mytodos-test'

    await connectToDB(MONGODB_URI, MONGODB_DB)
})

afterAll(async () => {
    closeConnection()
})

beforeEach(async () => {
    const db = getDB()
    await db.createCollection("todos")
})

afterEach(async () => {
    const db = getDB()
    await db.dropCollection("todos")
})

describe("GET /todos", () => {
    test("should respond with a 200 status code", async () => {
        const response = await request(app.callback()).get(baseUrl)
        expect(response.statusCode).toBe(200)   
    })

    test("should respond with JSON", async () => {
        const response = await request(app.callback()).get(baseUrl)
        expect(response.type).toBe("application/json")
    })

    test("should respond with list of existing todos", async () => {
        const testTodo = {title: "test", completed: false, completedAt: "2022-01-20T10:32:50.952Z", updatedAt: "2022-01-20T10:32:50.952Z"}
        const db = getDB()
        await db.collection("todos").insertOne(testTodo)
        const response = await request(app.callback()).get(baseUrl)
        todosBody = response.body
        expect(todosBody.length).toBe(1)
        todoToTest = todosBody[0]
        expect(todoToTest.title).toBe("test")
        expect(todoToTest.completed).toBe(false)
    })
})

describe("POST /todos", () => {
    test("should respond with a 200 status code & good parameters", async () => {
        const title = "Do homework"
        const response = await request(app.callback()).post(baseUrl).send("title=" + title)
        const responseBody = response.body

        const db = getDB()
        const list_todo = await db.collection("todos").find(query).toArray()

        expect(response.statusCode).toBe(200)   
        expect(responseBody).toBeDefined()
        expect(responseBody.id).toBeDefined()

        expect(list_todo.length).toBe(1)
        expect(list_todo[0].title).toBe(title)
    })
    test("should respond with a 422 status code when no title found", async () => {
        const response = await request(app.callback()).post(baseUrl)
        expect(response.statusCode).toBe(422)   
    })
    test("should respond with a 422 status code when empty title found", async () => {
        const response = await request(app.callback()).post(baseUrl).send("title=")
        expect(response.statusCode).toBe(422)   
    })
})

describe("DELETE /todos", () => {
    test("should respond with a 200 status code & good parameters", async () => {
        const testTodo = {title: "test", completed: false, completedAt: "2022-01-20T10:32:50.952Z", updatedAt: "2022-01-20T10:32:50.952Z"}
        const db = getDB()
        const test_elem = await db.collection("todos").insertOne(testTodo)
        const id = test_elem.insertedId.toString()

        const list_todo_before_delete = await db.collection("todos").find(query).toArray()
        expect(list_todo_before_delete[0].title).toBe("test")   

        const response = await request(app.callback()).delete(baseUrl + "/" + id)
        const list_todo_after_delete = await db.collection("todos").find(query).toArray()

        expect(response.statusCode).toBe(200)   
        expect(list_todo_after_delete.length).toBe(0)   
    })
    test("should respond with a 404 status code & still todo task present because id didn't match", async () => {
        const testTodo = {title: "test", completed: false, completedAt: "2022-01-20T10:32:50.952Z", updatedAt: "2022-01-20T10:32:50.952Z"}
        const db = getDB()
        await db.collection("todos").insertOne(testTodo)

        const list_todo_before_delete = await db.collection("todos").find(query).toArray()
        expect(list_todo_before_delete[0].title).toBe("test")   

        const response = await request(app.callback()).delete(baseUrl + "/" + "__WRONG_ID__")
        const list_todo_after_delete = await db.collection("todos").find(query).toArray()

        expect(response.statusCode).toBe(404)   
        expect(list_todo_after_delete.length).toBe(1)   
    })
})

describe("PUT /todos", () => {
    test("should respond with a 200 status code & both title and completed updated", async () => {
        const testTodo = {title: "test", completed: false, completedAt: "2022-01-20T10:32:50.952Z", updatedAt: "2022-01-20T10:32:50.952Z"}
        const db = getDB()
        const test_elem = await db.collection("todos").insertOne(testTodo)
        const id = test_elem.insertedId.toString()

        const list_todo_before_update = await db.collection("todos").find(query).toArray()
        expect(list_todo_before_update[0].title).toBe("test")   
        expect(list_todo_before_update[0].completed).toBe(false)   
        expect(list_todo_before_update[0].completedAt).toBe("2022-01-20T10:32:50.952Z")

        const response = await request(app.callback()).put(baseUrl + "/" + id).send("title=new_test").send("completed=true")
        const list_todo_after_update = await db.collection("todos").find(query).toArray()

        const new_updatedAt = (list_todo_before_update[0].updatedAt < list_todo_after_update[0].updatedAt)

        expect(response.statusCode).toBe(200)   
        expect(list_todo_after_update[0].title).toBe("new_test")   
        expect(list_todo_after_update[0].completed).toBe(true)  
        expect(new_updatedAt).toBe(true)    
    })
    test("should respond with a 200 status code & only title updated", async () => {
        const testTodo = {title: "test", completed: false, completedAt: "2022-01-20T10:32:50.952Z", updatedAt: "2022-01-20T10:32:50.952Z"}
        const db = getDB()
        const test_elem = await db.collection("todos").insertOne(testTodo)
        const id = test_elem.insertedId.toString()

        const list_todo_before_update = await db.collection("todos").find(query).toArray()
        expect(list_todo_before_update[0].title).toBe("test")   
        expect(list_todo_before_update[0].completed).toBe(false)   
        expect(list_todo_before_update[0].completedAt).toBe("2022-01-20T10:32:50.952Z")

        const response = await request(app.callback()).put(baseUrl + "/" + id).send("title=new_test")
        const list_todo_after_update = await db.collection("todos").find(query).toArray()

        const new_updatedAt = (list_todo_before_update[0].updatedAt < list_todo_after_update[0].updatedAt)

        expect(response.statusCode).toBe(200)   
        expect(list_todo_after_update[0].title).toBe("new_test")   
        expect(list_todo_after_update[0].completed).toBe(false)  
        expect(new_updatedAt).toBe(true)    
    })
    test("should respond with a 200 status code & only completed updated", async () => {
        const testTodo = {title: "test", completed: false, completedAt: "2022-01-20T10:32:50.952Z", updatedAt: "2022-01-20T10:32:50.952Z"}
        const db = getDB()
        const test_elem = await db.collection("todos").insertOne(testTodo)
        const id = test_elem.insertedId.toString()

        const list_todo_before_update = await db.collection("todos").find(query).toArray()
        expect(list_todo_before_update[0].title).toBe("test")   
        expect(list_todo_before_update[0].completed).toBe(false)   
        expect(list_todo_before_update[0].completedAt).toBe("2022-01-20T10:32:50.952Z")

        const response = await request(app.callback()).put(baseUrl + "/" + id).send("completed=true")
        const list_todo_after_update = await db.collection("todos").find(query).toArray()

        const new_updatedAt = (list_todo_before_update[0].updatedAt < list_todo_after_update[0].updatedAt)

        expect(response.statusCode).toBe(200)   
        expect(list_todo_after_update[0].title).toBe("test")   
        expect(list_todo_after_update[0].completed).toBe(true)  
        expect(new_updatedAt).toBe(true)    
    })

    test("should respond with a 422 status code & no changes because no updates created", async () => {
        const testTodo = {title: "test", completed: false, completedAt: "2022-01-20T10:32:50.952Z", updatedAt: "2022-01-20T10:32:50.952Z"}
        const db = getDB()
        const test_elem = await db.collection("todos").insertOne(testTodo)
        const id = test_elem.insertedId.toString()

        const list_todo_before_update = await db.collection("todos").find(query).toArray()
        expect(list_todo_before_update[0].title).toBe("test")   
        expect(list_todo_before_update[0].completed).toBe(false)   
        expect(list_todo_before_update[0].completedAt).toBe("2022-01-20T10:32:50.952Z")

        const response = await request(app.callback()).put(baseUrl + "/" + id)
        const list_todo_after_update = await db.collection("todos").find(query).toArray()

        const no_new_updatedAt = (list_todo_before_update[0].updatedAt == list_todo_after_update[0].updatedAt)

        expect(response.statusCode).toBe(422)   
        expect(list_todo_after_update[0].title).toBe("test")   
        expect(list_todo_after_update[0].completed).toBe(false)  
        expect(no_new_updatedAt).toBe(true)    
    })
    test("should respond with a 404 status code & still todo task present because id didn't match", async () => {
        const testTodo = {title: "test", completed: false, completedAt: "2022-01-20T10:32:50.952Z", updatedAt: "2022-01-20T10:32:50.952Z"}
        const db = getDB()
        await db.collection("todos").insertOne(testTodo)

        const list_todo_before_update = await db.collection("todos").find(query).toArray()
        expect(list_todo_before_update[0].title).toBe("test")   

        const response = await request(app.callback()).put(baseUrl + "/" + "__WRONG_ID__")
        const list_todo_after_delete = await db.collection("todos").find(query).toArray()

        expect(response.statusCode).toBe(404)   
        expect(list_todo_after_delete.length).toBe(1)   
    })
})