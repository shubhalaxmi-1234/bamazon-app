var mysql = require("mysql");
var Table = require('cli-table');
var clear = require('clear');
const chalk = require('chalk');
var figlet = require('figlet');
var inquirer = require("inquirer");
var dotenv = require('dotenv').config();

var connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE
});

connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId + "\n");
    clear();
    // connection.end();

    displayProducts();
});

function displayProducts() {
    connection.query("SELECT * FROM products", function (err, res) {
        if (err) throw err;
        var table = new Table({
            chars: {
                'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗'
                , 'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝'
                , 'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼'
                , 'right': '║', 'right-mid': '╢', 'middle': '│'
            },
            head: ['Id', 'Name', 'Price']
        });

        for (var i = 0; i < res.length; i++) {
            table.push([res[i].item_id, res[i].product_name, '$' + res[i].price]);
        }
        console.log("\nWelcome to Bamazon");
        console.log(table.toString());
        // connection.end();
        askIfWanttToBuy()
    });
}

function askIfWanttToBuy() {
    inquirer
        .prompt([
            {
                type: 'confirm',
                name: "buy",
                message: " Do you want to buy a product?"
            }
        ])
        .then(function (answer) {
            if (answer.buy === true) {
                askWhatToBuy();
            }
            else {
                console.log(chalk.yellow.bold("\nOkay, another time then."))
                connection.end();
            }
        });
}


function askWhatToBuy() {
    inquirer
        .prompt([
            {
                name: "id",
                type: "input",
                message: "What is the id of the item you would like to buy?",
                validate: function (value) {
                    var reg = /^\d+$/;
                    return reg.test(value) || "Id should be a number!";
                }
            },
            {
                name: "amount",
                type: "input",
                message: "How many would you like to buy?",
                validate: function (value) {
                    var reg = /^\d+$/;
                    return reg.test(value) || "Amount should be a number!";
                },
                default: 1
            }
        ])
        .then(function (answer) {
            connection.query("SELECT * FROM products where ?",
                {
                    item_id: answer.id
                }, function (err, res) {
                    if (err) throw err;
                    //console.log(res);
                    // console.log(res[0].stock_quantity);
                    // console.log(answer.amount);
                    if (res[0].stock_quantity >= answer.amount) {
                        console.log('\nPurchased!');
                        //Update database
                        var newQuantity = res[0].stock_quantity - parseInt(answer.amount);

                        var totalCost = parseInt(answer.amount) * res[0].price;
                        var sales = res[0].product_sales + totalCost;

                        updateQuantity(answer.id, newQuantity, sales);
                        console.log('\nTotal Cost: ' + totalCost);
                        askIfWanttToBuy();
                    }
                    else {
                        console.log('\nInsufficient Quantity.');
                        askIfWanttToBuy();
                    }
                });
        });
}

function updateQuantity(id, amount, sales) {
    connection.query("UPDATE products set ? where ?",
        [
            {
                stock_quantity: amount,
                product_sales: sales
            },
            {
                item_id: id
            }
        ], function (err, res) {

        });
}
