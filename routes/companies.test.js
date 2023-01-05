process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompanies;
let testInvoices;
beforeAll(async ()=>{
    await db.query(`DELETE FROM companies`);
})
beforeEach(async ()=>{
    const companyRes = await db.query(
        `INSERT INTO companies (code, name, description) 
        VALUES ('tesla', 'Tesla', 'An EV company run by Musk'),
        ('apple', 'Apple', 'Steve Jobs company')
        RETURNING *`)
    const invoiceRes = await db.query(
            `INSERT INTO invoices (comp_code, amt, paid, paid_date) 
            VALUES ('tesla', 200, false, null),
            ('apple', 300, false, null),
            ('tesla', 100, true, '2018-01-01')
            RETURNING *`)
    testCompanies = companyRes.rows;
    testInvoices = invoiceRes.rows;
})

afterEach(async ()=>{
    await db.query(`DELETE FROM companies`);
})

afterAll(async ()=>{
    await db.end();
})

describe("GET /companies", ()=>{
    test("Get an array with two companies", async ()=>{
        const res = await request(app).get('/companies');
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({companies: testCompanies})
    })
})

describe("POST /companies", ()=>{
    test("Create a single company with all inputs filled out", async ()=>{
        const res = await request(app).post('/companies').send({code: 'ford', name: 'Ford Motors', description: 'American car company'});
        expect(res.statusCode).toBe(201)
        expect(res.body).toEqual({company: {code: 'ford', name: 'Ford Motors', description: 'American car company'}})
    })
    test("Create a single company without inputting a code", async ()=>{
        const res = await request(app).post('/companies').send({name: 'Ford Motors', description: 'American car company'});
        expect(res.statusCode).toBe(201)
        expect(res.body).toEqual({company: {code: 'Ford-Motors', name: 'Ford Motors', description: 'American car company'}})
    })
    test("Responds with 400 for bad request", async ()=>{
        const res = await request(app).post('/companies').send({name: 'Ford Motors'});
        expect(res.statusCode).toBe(400)
    })
})

describe("GET /companies/:code", ()=>{
    test("Get a single company", async ()=>{
        const res = await request(app).get('/companies/tesla');
        const { code, name, description } = testCompanies[0]
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({company: {code, name, description, invoices: [expect.any(Number), expect.any(Number)]}})
    })
    test("Responds with 404 for invalid company code", async ()=>{
        const res = await request(app).get('/companies/chickensarecool');
        expect(res.statusCode).toBe(404)
    })
})

describe("PUT /companies/:code", ()=>{
    test("Update a single company", async ()=>{
        const res = await await request(app).put('/companies/tesla').send({name: "Not Tesla", description: "cars cars cars"});
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({company: {name: "Not Tesla", description: "cars cars cars", code: "tesla"}})
    })
    test("Responds with 404 for invalid company code", async ()=>{
        const res = await request(app).put('/companies/chickensarecool').send({name: "Not Tesla", description: "cars cars cars"});
        expect(res.statusCode).toBe(404)
    })
})

describe("DELETE /companies/:code", ()=>{
    test("Deletes a single company", async ()=>{
        const res = await request(app).delete(`/companies/${testCompanies[0].code}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({status: "Deleted"});
    })
})