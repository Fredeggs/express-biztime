/** Routes for invoices. */

const db = require("../db");
const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();

router.get("/", async function (req, res, next) {
    try {
        const results = await db.query(
            `SELECT id, comp_code FROM invoices`);

        return res.json({invoices: results.rows});
    }

    catch (err) {
        return next(err);
    }
});

router.post("/", async function (req, res, next) {
    try {
        const { comp_code, amt } = req.body;
        if(!comp_code || !amt ){
            throw new ExpressError(`Bad Request: Please enter a valid code, name and description`, 400)
        }
        const results = await db.query(
            `INSERT INTO invoices (comp_code, amt) 
             VALUES ($1, $2)
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
          [comp_code, amt]
      );
        return res.status(201).json({invoice: results.rows[0]});
    }

    catch (err) {
        return next(err);
    }
});

router.get("/:invoiceID", async function (req, res, next) {
    try {
        const { invoiceID } = req.params
        const invoiceRes = await db.query(
            `SELECT * FROM invoices WHERE id=$1`, [invoiceID]);
        if (invoiceRes.rows.length === 0){
            throw new ExpressError(`Bad Request: Can't find invoice with id of: ${invoiceID}`, 404)
        }
        companyRes = await db.query(`SELECT * FROM companies WHERE code=$1`, [invoiceRes.rows[0].comp_code])
        const {id, amt, paid, add_date, paid_date} = invoiceRes.rows[0]
        return res.json({invoice: {id, amt, paid, add_date, paid_date, company: companyRes.rows[0]}});
    }

    catch (err) {
        return next(err);
    }
});

router.put("/:id", async function (req, res, next) {
    try {
        const { id } = req.params;
        const {amt, paid} = req.body;
        const isPaid = await db.query(`SELECT paid FROM invoices WHERE id=$1`, [id])
        let results;
        if (!amt && !paid){
            throw new ExpressError(`Bad Request: Please enter valid input`, 400)
        }
        if (paid && amt){
            results = await db.query(
                `UPDATE invoices SET amt=$1, paid=$2
               WHERE id = $3
               RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [amt, paid, id]);
            if (results.rows.length === 0){
                throw new ExpressError(`Not Found: Can't find invoice with id of: ${id}`, 404)
            }
            return res.json({invoice: results.rows[0]});
        }
        if (!paid){
            results = await db.query(
                `UPDATE invoices SET amt=$1
               WHERE id = $2
               RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [amt, id]);
            if (results.rows.length === 0){
                throw new ExpressError(`Not Found: Can't find invoice with id of: ${id}`, 404)
            }
            return res.json({invoice: results.rows[0]});
        }
        if (!amt & !isPaid){
            const paid_date = new Date().toISOString();
            results = await db.query(
                `UPDATE invoices SET paid=$1, paid_date=$2
               WHERE id = $3
               RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [paid, paid_date, id]);
            if (results.rows.length === 0){
                throw new ExpressError(`Not Found: Can't find invoice with id of: ${id}`, 404)
            }
            return res.json({invoice: results.rows[0]});
        }
        if (!amt & isPaid){
            const paid_date = null
            results = await db.query(
                `UPDATE invoices SET paid=$1, paid_date=$2
               WHERE id = $3
               RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [paid, paid_date, id]);
            if (results.rows.length === 0){
                throw new ExpressError(`Not Found: Can't find invoice with id of: ${id}`, 404)
            }
            return res.json({invoice: results.rows[0]});
        }
    }
    catch (err) {
        return next(err);
    }
});

router.delete("/:id", async function (req, res, next) {
    try {
        const { id } = req.params;
        const results = await db.query(
            `DELETE FROM invoices WHERE id = $1`,
            [id]);
        if(results.rowCount === 0){
            throw new ExpressError(`Bad Request: Could not delete invoice with code: ${id}`, 404);
        }
        return res.json({status: "Deleted"});
    }
    catch (err) {
        return next(err);
    }
});

module.exports = router;