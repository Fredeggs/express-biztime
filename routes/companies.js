/** Routes for companies. */

const db = require("../db");
const slugify = require("slugify")
const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();

router.get("/", async function (req, res, next) {
    try {
        const results = await db.query(
            `SELECT code, name, description FROM companies`);

        return res.json({companies: results.rows});
    }

    catch (err) {
        return next(err);
    }
});

router.post("/", async function (req, res, next) {
    try {
        let { code, name, description } = req.body
        if(!name || !description){
            throw new ExpressError(`Please enter a valid code, name and description`, 400)
        }
        if(!code && name && description){
            code = slugify(name);
        }
        const results = await db.query(
            `INSERT INTO companies (code, name, description) 
             VALUES ($1, $2, $3)
             RETURNING code, name, description`,
          [code, name, description]);
        return res.status(201).json({company: results.rows[0]});
    }

    catch (err) {
        return next(err);
    }
});

router.get("/:companyCode", async function (req, res, next) {
    try {
        const { companyCode } = req.params
        const companyRes = await db.query(
            `SELECT c.code, c.name, c.description, i.id, i.amt, i.paid, i.add_date, i.paid_date 
            FROM companies AS c
            LEFT JOIN invoices AS i
            ON c.code = i.comp_code
            WHERE c.code=$1`, [companyCode]);
        if (companyRes.rows.length === 0){
            throw new ExpressError(`Can't find company with code of: ${companyCode}`, 404)
        }
        let { code, name, description } = companyRes.rows[0];
        let invoices = companyRes.rows.map(r => r.id);

        return res.json({company: {code, name, description, invoices}});
    }

    catch (err) {
        return next(err);
    }
});

router.put("/:companyCode", async function (req, res, next) {
    try {
        const { companyCode } = req.params;
        const {name, description} = req.body;
        if (!name && !description){
            throw new ExpressError(`Please enter a valid input for name and description`, 400)
        }
        const results = await db.query(
            `UPDATE companies SET name=$1, description=$2
           WHERE code = $3
           RETURNING name, description, code`,
        [name, description, companyCode]);
        if (results.rows.length === 0){
            throw new ExpressError(`Can't find company with code of: ${companyCode}`, 404)
        }
        return res.json({company: results.rows[0]});
    }
    catch (err) {
        return next(err);
    }
});

router.delete("/:companyCode", async function (req, res, next) {
    try {
        const { companyCode } = req.params;
        const selectMsg = await db.query(`SELECT * FROM companies WHERE code = $1`, [companyCode]);
        if(selectMsg.rows.length === 0){
            throw new ExpressError(`Could not delete company with code: ${companyCode}`, 404);
        }
        const results = await db.query(
            `DELETE FROM companies WHERE code = $1`,
            [companyCode]);
        return res.json({status: "Deleted"});
    }
    catch (err) {
        return next(err);
    }
});

module.exports = router;