process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompanies;
let testInvoices;
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

describe("GET /invoices", ()=>{
    test("Get an array with three invoices", async ()=>{
        const res = await request(app).get('/invoices');
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({invoices: [
            {comp_code: testInvoices[0].comp_code, id: testInvoices[0].id},
            {comp_code: testInvoices[1].comp_code, id: testInvoices[1].id},
            {comp_code: testInvoices[2].comp_code, id: testInvoices[2].id}
        ]})
    })
})

describe("POST /invoices", ()=>{
    test("Create a single invoice", async ()=>{
        const res = await request(app).post('/invoices').send({comp_code: "tesla", amt: 78})
        expect(res.statusCode).toBe(201)
        expect(res.body).toEqual({invoice: {
            id: expect.any(Number),
            comp_code: "tesla",
            amt: 78,
            paid: false,
            add_date: expect.any(String),
            paid_date: null
        }})
    })
    test("Responds with 400 status code", async ()=>{
        const res = await request(app).post('/invoices').send({ amt: 78})
        expect(res.statusCode).toBe(400)
    })
})

describe("GET /invoices/:id", ()=>{
    test("Get a single invoice", async ()=>{
        const { id, amt, paid, paid_date} = testInvoices[0]
        const {code, name, description} = testCompanies[0]
        const res = await request(app).get(`/invoices/${id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({invoice: {
            id: id,
            amt: amt,
            paid: paid,
            add_date: expect.any(String),
            paid_date: paid_date,
            company: {
                code: code,
                name: name,
                description: description
            }}})
    })
    test("Responds with 404", async ()=>{
        const res = await request(app).get(`/invoices/0`);
        expect(res.statusCode).toBe(404);
    })
})

describe("PUT /invoices/:id", ()=>{
    test("Update a single invoice", async ()=>{
        const { id, comp_code, paid, paid_date} = testInvoices[0]
        const res = await request(app).put(`/invoices/${id}`).send({amt: 900000})
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({invoice: {
            id: id,
            comp_code: comp_code,
            amt: 900000,
            paid: paid,
            add_date: expect.any(String),
            paid_date: paid_date,
            }})
    })
    test("Responds with 404", async ()=>{
        const res = await request(app).put(`/invoices/0`).send({amt: 900000})
        expect(res.statusCode).toBe(404);
    })
})

describe("DELETE /invoices/:id", ()=>{
    test("Delete a single invoice", async ()=>{
        const res = await request(app).delete(`/invoices/${testInvoices[0].id}`)
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({status: "Deleted"})
    })
    test("Responds with 404", async ()=>{
        const res = await request(app).delete(`/invoices/0`);
        expect(res.statusCode).toBe(404);
    })
})