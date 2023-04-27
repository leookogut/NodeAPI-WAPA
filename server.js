require("dotenv").config();

const axios = require("axios");
const bodyParser = require("body-parser");
//const router = require("./router");
const msgURL = process.env.MESSAGES_URL;
const accessToken = process.env.AUTH_KEY_VALUE;
const namespace = process.env.NAMESPACE;
const Sandbox_user_phone = process.env.SANDBOX_RECIPIENT_PHONE;
const Sandbox_msgURL = process.env.SANDBOX_MESSAGES_URL;
const Sandbox_accessToken = process.env.SANDBOX_AUTH_KEY_VALUE;
const Sandbox_namespace = process.env.SANDBOX_NAMESPACE;
const hostURL = process.env.HOST_URL;

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Product = require("./models/productModel");
const app = express();

//app.use(express.json())
//app.use(express.urlencoded({extended: false}))

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;
const MONGO_DB_URI = process.env.MONGO_DB_URI;

//routes

app.get("/", (req, res) => {
    res.send("Hello NODE API");
});

const axiosConfig = {
    headers: {
        "Content-Type": "application/json",
    },
};

app.get("/products", async (req, res) => {
    try {
        const products = await Product.find({}).sort({ _id: 1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get("/productsdate", async (req, res) => {
    try {
        const products = await Product.find({
            createdAt: {
                $gte: new Date("2015-10-01T00:00:00.000Z"),
                $lt: new Date("2024-03-13T16:17:36.470Z"),
            },
        });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get("/query", async (req, res) => {
    try {
        const products = await Product.find(req.body);
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get("/products/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get("/products/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post("/products", async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.status(200).json(product);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
});

// update a product
app.put("/products/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndUpdate(id, req.body);
        // we cannot find any product in database
        if (!product) {
            return res
                .status(404)
                .json({ message: `cannot find any product with ID ${id}` });
        }
        const updatedProduct = await Product.findById(id);
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// delete a product

app.delete("/products/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            return res
                .status(404)
                .json({ message: `cannot find any product with ID ${id}` });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const formatDate = (dateUTC) => {
    const options = { dateStyle: "long", timeStyle: "short" };
    const date = new Date(dateUTC).toLocaleString("pt-br", options);
    return date;
};

const minutes_difference = (timestamp1, timestamp2) => {
    let difference = timestamp1 - timestamp2;
    let min_diff = Math.floor(difference / 1000 / 60);
    return min_diff;
};

const message_minutes_passed = (message_timestamp) => {
    let messageTime = new Date(message_timestamp * 1000);
    let nowTime = Math.floor(Date.now());
    let minutes_passed = minutes_difference(nowTime, messageTime);
    return minutes_passed;
};

app.post("/webhook", async function (req, res) {
    res.status(200);

    console.log("Mensagem: ", JSON.stringify(req.body, null, " "));

    if (!req.body.statuses) {
        let phone = req.body.messages[0].from;
        let name = req.body.contacts[0].profile.name;

        let receivedMessage;
        let response;

        let type = req.body.messages[0].type;

        let timestamp = parseInt(req.body.messages[0].timestamp);
        console.log(timestamp);

        let minutes_passed = message_minutes_passed(timestamp);
        console.log(minutes_passed);

        if (minutes_passed <= 15) {
            if (type == "text") {
                receivedMessage = req.body.messages[0].text.body;
            } else if (type == "button") {
                receivedMessage = req.body.messages[0].button.text;
            } else {
                receivedMessage =
                    "Desculpe, responda apenas clicando nos botões ou com texto.";
            }

            if (receivedMessage == "Sim, já transferi") {
                response = `Ok! Estamos preparando o envio do Pix, ${name}`;

                const task = {
                    seller_name: name,
                    seller_phone: phone,
                };

                console.log(JSON.stringify(task));

                //await fetch(`http://localhost:${PORT}/products`, {
                /*
                await fetch(`${hostURL}/products`, {
                    method: "post",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(task),
                });*/

                await axios
                    .post(`${hostURL}/products`, task, axiosConfig)
                    .then((res) => {
                        console.log("MONGO UPDATED");
                    })
                    .catch((err) => {
                        console.log("MONGO AXIOS ERROR: ", err);
                    });
            } else {
                response = await sendTemplate_Help(phone, name);
            }
        }

        await sendMessage(phone, response);
        //await new Promise((r) => setTimeout(r, 5000));
        await sendMessageSandbox(Sandbox_user_phone, response);
        //await sendMessageTemplate(phone, response);
    }
});

async function sendMessage(phone, response) {
    try {
        let payload = await axios.post(
            msgURL,
            {
                recipient_type: "individual",
                to: phone,
                type: "text",
                text: {
                    body: response,
                },
            },
            {
                headers: {
                    "D360-API-KEY": accessToken,
                },
            }
        );
        return payload.data;
    } catch (error) {
        console.log(error);
    }
}

async function sendMessageSandbox(phone, response) {
    try {
        let payload = await axios.post(
            Sandbox_msgURL,
            {
                recipient_type: "individual",
                to: phone,
                type: "text",
                text: {
                    body: response,
                },
            },
            {
                headers: {
                    "D360-API-KEY": Sandbox_accessToken,
                },
            }
        );
        return payload.data;
    } catch (error) {
        console.log(error);
    }
}

async function sendMessageTemplate(phone, response) {
    try {
        let payload = await axios.post(
            msgURL,
            {
                to: phone,
                type: "template",
                template: {
                    namespace: namespace,
                    language: {
                        policy: "deterministic",
                        code: "pt_BR",
                    },
                    name: "seller_payment_received",
                    components: [
                        {
                            type: "body",
                            parameters: [
                                {
                                    type: "text",
                                    text: `${phone}`,
                                },
                                {
                                    type: "text",
                                    text: `${response}`,
                                },
                            ],
                        },
                    ],
                },
            },
            {
                headers: {
                    "D360-API-KEY": accessToken,
                },
            }
        );
        return payload.data;
    } catch (error) {
        console.log(error);
    }
}

async function sendTemplate_Help(phone, name) {
    try {
        let payload = await axios.post(
            msgURL,
            {
                to: phone,
                type: "template",
                template: {
                    namespace: namespace,
                    language: {
                        policy: "deterministic",
                        code: "pt_BR",
                    },
                    name: "get_help",
                    components: [
                        {
                            type: "body",
                            parameters: [
                                {
                                    type: "text",
                                    text: `${name}`,
                                },
                            ],
                        },
                    ],
                },
            },
            {
                headers: {
                    "D360-API-KEY": accessToken,
                },
            }
        );
        return payload.data;
    } catch (error) {
        console.log(error);
    }
}

mongoose.set("strictQuery", false);
mongoose
    .connect(`${MONGO_DB_URI}`)
    .then(() => {
        console.log("connected to MongoDB");
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.log(error);
    });
