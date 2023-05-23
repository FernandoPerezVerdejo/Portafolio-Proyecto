import express, { Router } from "express";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import indexRoutes from "./routes/routes.js";
import hbs from "hbs";
import bodyParser from 'body-parser';
import session from "express-session";

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

hbs.registerPartials(join(__dirname, "/views/partials"));
app.use(indexRoutes);
app.set('view engine', 'hbs');
app.set('views', './views');
app.use(express.static("public"));



app.listen(3000);
export default Router;