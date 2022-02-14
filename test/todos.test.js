const { ObjectId } = require("mongodb")
const request = require("supertest")
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
        const response = await (await request(app.callback()).post(baseUrl).send('title=Do homework'))
        console.log(response.statusCode)
        expect(response.statusCode).toBe(200)   
    })
    test("should respond with a 422 status code when no title found", async () => {
        const response = await request(app.callback()).post(baseUrl)
        console.log(response.statusCode)
        expect(response.statusCode).toBe(422)   
    })
    test("should respond with a 422 status code when empty title found", async () => {
        const response = await request(app.callback()).post(baseUrl).send('title=')
        console.log(response.statusCode)
        expect(response.statusCode).toBe(422)   
    })
})
