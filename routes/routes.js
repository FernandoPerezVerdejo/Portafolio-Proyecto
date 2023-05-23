import { Router } from "express";
import pool from "../server2.js";

const router = Router();
let objusuario = "";  //variable que contiene la información de sesión
let datosuser = "";     //misma función que la variable de arriba pero con más fácil acceso


router.get('/', (req, res) => {  //carga de página de inicio, la cual carga o no carga complementos segun 
	if (objusuario == "") {		//el usuario que entre. rol=0 Paciente, rol=1 Médico, rol=2 ADMIN
		res.render('home', { flag: 0, Iniciar: 1, Menu: 0, menuadmin: 0, Registro: 1 })
	} else if (objusuario.rows[0].rol == '0') {
		datosuser = objusuario.rows[0];
		res.render('home', { flag: 1, Iniciar: 0, Menu: 1, menuadmin: 0, Registro: 0, datosuser })
	} else if (objusuario.rows[0].rol == '1') {
		datosuser = objusuario.rows[0];
		res.render('home', { flag: 1, Iniciar: 0, Menu: 1, menuadmin: 0, Registro: 0, Medico: 1, datosuser })
	} else {
		(objusuario.rows[0].rol == '2')
		datosuser = objusuario.rows[0];
		res.render('home', { flag: 1, Iniciar: 0, Menu: 1, menuadmin: 1, Registro: 0, Medico: 1, datosuser })
	}
})

router.get('/contacto', (req, res) => { //carga de la página de contacto
	if (objusuario == "") {
		res.render('contacto', { flag: 0, Iniciar: 1, Menu: 0, Registro: 1 })
	} else {
		res.render('contacto', { flag: 1, Iniciar: 0, Menu: 1, Registro: 0, datosuser });
	}
})

router.get('/login', (req, res) => { //carga de la pagina para iniciar sesión
	res.render('login', { Iniciar: 1, Registro: 1 });
});

router.get('/recetario', async (req, res) => { // pendiente
	// validacion de usuario logeado
	//let receta = await pool.query('SELECT * FROM users WHERE $1=username', [usuario logeado]);
	if (objusuario == "") {
		res.render('home', { flag: 0, Iniciar: 1, Menu: 0, Registro: 1, menuadmin: 0 })
	} else if (objusuario.rows[0].rol) {
		//console.log(objusuario);
		let result = await fetch(`http://localhost:4000/api/v1/buscarRecetaRUT/${objusuario.rows[0].rut_users}`)
		result = await result.json();
		result.rows.forEach(element => { //foreach para cambiar estado true o false a vigente o no vigente
			if (element.vigente == true) {
				element.vigente = "Vigente";
			} else element.vigente = "No Vigente"
		});
		result.rows.forEach(element => {
			//convertir fecha a arreglo y luego aplicar slice y devolver la fecha en otro formato
			//y luego devuelta a string para mostrar en pagina ordenada en DD-MM-YYYY
			element.fechaemision = Array.from(element.fechaemision);
			element.fechaemision = element.fechaemision.slice(0, 10);
			let fechaemision = element.fechaemision;
			var fecha = "";
			for (let index = 0; index < fechaemision.length; index++) {
				fecha = fecha + fechaemision[index];
				element.fechaemision = fecha;
				let año = element.fechaemision.slice(0, 4);
				let mes = element.fechaemision.slice(4, 8);
				let dia = element.fechaemision.slice(8, 10);
				element.fechaemision = dia + mes + año;
			}
		});
		let resultado = result.rows;
		res.render('recetario', { resultado })
	}
});


router.post('/app', async (req, res) => { // envio post de los datos ingresados en la página de iniciar sesión
	let user = req.body.username;
	let pass = req.body.password;

	//manda los datos ingresados y espera la respuesta
	objusuario = await fetch(`http://localhost:4000/api/v1/login/${user}&${pass}`);
	objusuario = await objusuario.json();
	//respuesta de la API
	let message = "";
	if (objusuario.rows[0]) {
		//si el usuario existe en la base de datos se inicia sesión y se renderiza con un mensaje de éxito
		//además de tomar la existencia del usuario de ahora en adelante
		req.session.loggedin = true;
		req.session.username = user;
		res.render('login', { message: "Inicio de Sesión Exitoso", boton: "OK", Registro: 1 });
	} else {
		//si el usuario no existe se renderiza la página con un mensaje de error
		objusuario = "";
		datosuser = "";
		res.render('login', { message: "Usuario o Contraseña Incorrectos", botonNo: "OK" });
	}
});

router.get('/logout', async (req, res) => {  // Este es la parte del boton de cerrar sesión en el modal
	req.session.destroy(); //comando que borra la sesion
	objusuario = ""; // comandos para borrar la información del usuario
	datosuser = "";
	res.redirect('/');
});

router.get('/admin', async (req, res) => {  // página de ADMIN
	if (objusuario.rows[0].rol == '2' && req.session.loggedin) {//si el usuario actual tiene rol de admin puede entrar a la página
		//se manda a la API un GET de la lista de pacientes registrados y se espera su respuesta
		let result = await fetch('http://localhost:4000/api/v1/listarpacientes');
		result = await result.json();
		result.forEach(element => {
			//comando para convertir fecha a arreglo y luego aplicar slice y devolver la fecha en otro formato
			//y luego devuelta a string para mostrar en pagina ordenada en DD-MM-YYYY
			element.fechanac = Array.from(element.fechanac);
			element.fechanac = element.fechanac.slice(0, 10);
			let fechanac = element.fechanac;
			var fecha = "";
			for (let index = 0; index < fechanac.length; index++) {
				fecha = fecha + fechanac[index];
				element.fechanac = fecha;
				let año = element.fechanac.slice(0, 4);
				let mes = element.fechanac.slice(4, 8);
				let dia = element.fechanac.slice(8, 10);
				element.fechanac = dia + mes + año;
			}
		});
		//se manda a la API un GET de la lista de usuarios y se espera su respuesta
		let result2 = await fetch('http://localhost:4000/api/v1/listarusuarios');
		result2 = await result2.json();

		//mismo procedimiento para ajustar la fecha 
		result2.forEach(element => {
			element.creado = Array.from(element.creado);
			element.creado = element.creado.slice(0, 10);
			let fechacreado = element.creado;
			var creado = "";
			// ajustar la fecha a formato DD-MM-YYYY
			for (let index = 0; index < fechacreado.length; index++) {
				creado = creado + fechacreado[index];
				element.creado = creado;
				let año = element.creado.slice(0, 4);
				let mes = element.creado.slice(4, 8);
				let dia = element.creado.slice(8, 10);
				element.creado = dia + mes + año;
			}
			//cambiar el N° de Rol por Nombre del Rol
			if (element.rol == 0) {
				element.rol = "Paciente";
			} else if (element.rol == 1) {
				element.rol = "Médico";
			} else if (element.rol == 2) {
				element.rol = "Admin";
			}
		})
		//se renderiza la página de admin ademas de cargar la lista de pacientes y usuarios
		res.render('admin', { flag: 1, result, result2, datosuser });
	}
	else {
		res.redirect('/')
	}
});

router.get('/register', (req, res) => { //carga de página de registro
	res.render('register', { Registro: 1, Iniciar: 1 })
});

router.post('/register?', async (req, res) => { //envio de registro de rol Paciente o normal
	let rut = req.body.rut;
	let nombre = req.body.nombre;
	let apellido = req.body.apellido;
	let fechanac = req.body.fechanac;
	let direccion = req.body.direccion;
	let telefono1 = req.body.telefono1;
	let telefono2 = req.body.telefono2;
	let username = req.body.username;
	let password = req.body.password;
	let email = req.body.email;
	//se busca primero si existe en la base de datos
	let result = await fetch(`http://localhost:4000/api/v1/buscar/${username}`);
	result = await result.json();
	if (result.length != 0) {
		//si encuentra coincidencia se va a home
		res.render('home', { flag: 0, Iniciar: 1, Registro: 1 })
	} else {
		//si no se encuentra el usuario se inserta mediante post
		let result2 = await fetch(`http://localhost:4000/api/v1/register?`, {
			method: "POST",
			body: JSON.stringify({ rut, nombre, apellido, fechanac, direccion, telefono1, telefono2, username, password, email }),
			headers: { "Content-Type": "application/json" }
		});
		res.render('login');
	}
});

router.get('/registromedico', (req, res) => { // carga de página para registrar Médicos
	//valida que el que entre sea ADMIN
	if (req.session.loggedin) {
		if (objusuario.rows[0].rol == '2') {
			res.render('registromedico')
		} else { res.redirect('/'); }
	}
	else {
		res.redirect('/');
	}
});

router.post('/registromedico', async (req, res) => { // envio post para registrar Médico
	let rut = req.body.rut;
	let nombre = req.body.nombre;
	let apellido = req.body.apellido;
	let fechanac = req.body.fechanac;
	let direccion = req.body.direccion;
	let telefono1 = req.body.telefono1;
	let telefono2 = req.body.telefono2;
	let username = req.body.username;
	let password = req.body.password;
	let email = req.body.email;
	//se obtiene de la API si el usuario ya esta y se espera respuesta
	let result = await fetch(`http://localhost:4000/api/v1/buscar/${username}`);
	result = await result.json();
	if (result.length != 0) {
		//si lo encuentra ya existe y se manda a home
		res.render('home');
	} else {
		//si no se encuentra se utiliza el método post para insertarlo en la base de datos
		let result2 = await fetch(`http://localhost:4000/api/v1/registromedico`, {
			method: "POST",
			body: JSON.stringify({ rut, nombre, apellido, fechanac, direccion, telefono1, telefono2, username, password, email }),
			headers: { "Content-Type": "application/json" }
		});
		res.render('login');
	}
});

router.get('/medico', async (req, res) => { //carga de la página de Médico
	let datareceta = "";
	// se valida que el que entre sea Médico o ADMIN
	if (req.session.loggedin) {
		if (objusuario.rows[0].rol === '1' || objusuario.rows[0].rol === '2') {
			res.render('medico', { flag: 1, datosuser, datareceta, btnanadir: 0, Medico: 1 })
		} else { res.redirect('/') }
	}
	else {
		res.redirect('/');
	}
});

router.post('/buscarpaciente/', async (req, res) => { // método post para buscar paciente mediante rut
	let rut = req.body.rut;
	//se obtiene el rut desde el formulario y se envia a la API
	let result = await fetch(`http://localhost:4000/api/v1/buscarRUT/${rut}`);
	result = await result.json();
	//al encontrar el rut devuelve la respuesta
	if (result == "") {
		//si no se encontro coincidencias es porque no hay datos de la persona
		res.render('medico', { btnanadir: 1, Medico: 1, message1: "No se encontraron datos" })
	} else {
		let datareceta = result[0];
		//en caso contrario se carga los datos de la persona
		//además se buscan los datos de medicamentos para añadir una receta
		let buscarmedicamentos = await fetch(`http://localhost:4000/api/v1/buscarpaciente`);
		let medicamentos = await buscarmedicamentos.json();
		res.render('medico', { datareceta, btnanadir: 1, Medico: 1, medicamentos })
	}
});

router.post('/buscarreceta/', async (req, res) => {  //método post para buscar recetas mediante rut
	let rut = req.body.rut;
	// se obtiene el rut mediante el formulario
	//se buscan datos mediante el rut y se espera su respuesta
	let result = await fetch(`http://localhost:4000/api/v1/buscarRecetaRut/${rut}`);
	result = await result.json();
	if (result.rows == "") {
		//si no se encuentran recetas se cargará la página de médico con el mensaje respectivo
		res.render('medico', { receta: "No hay recetas disponibles" })
	} else {
		//en caso contrario se mostrarán las recetas disponibles
		result.rows.forEach(element => { //foreach para cambiar estado true o false a vigente o no vigente
			if (element.vigente == true) {
				element.vigente = "Vigente";
			} else element.vigente = "No Vigente"
		});
		result.rows.forEach(element => {
			//convertir fecha a arreglo y luego aplicar slice y devolver la fecha en otro formato
			//y luego devuelta a string para mostrar en pagina ordenada en DD-MM-YYYY
			element.fechaemision = Array.from(element.fechaemision);
			element.fechaemision = element.fechaemision.slice(0, 10);
			let fechaemision = element.fechaemision;
			var fecha = "";
			for (let index = 0; index < fechaemision.length; index++) {
				fecha = fecha + fechaemision[index];
				element.fechaemision = fecha;
				let año = element.fechaemision.slice(0, 4);
				let mes = element.fechaemision.slice(4, 8);
				let dia = element.fechaemision.slice(8, 10);
				element.fechaemision = dia + mes + año;
			}
		});

		let resultadoreceta1 = result.rows;
		//se recibe de la api la lista de medicamentos para poder modificar más adelante las recetas
		let medicinas0 = await fetch(`http://localhost:4000/api/v1/listarmedicamentos`);
		medicinas0 = await medicinas0.json();
		//y carga la respuesta
		let medicinas = medicinas0;
		res.render('medico', { receta: "Esta(s) son las recetas disponibles", resultadoreceta1, medicinas })
	}
});

router.post('/anadirreceta/', async (req, res) => { // método post para insertar recetas
	let rutpaciente = req.body.rutpaciente;
	let rutmedico = req.body.rutmedico;
	let nommedico = req.body.nombremedico;
	let especialidad = req.body.especialidadmedico;
	let medicamento0 = req.body.medicamento;
	let prescripcion = req.body.prescripcion;
	// se obtienen los valores del formulario
	//y se envian los valores a la API
	let result = await fetch(`http://localhost:4000/api/v1/insertReceta`, {
		method: "POST",
		body: JSON.stringify({ rutpaciente, rutmedico, nommedico, especialidad }),
		headers: { "Content-Type": "application/json" }
	});
	result = await result.json();
	let id_receta = result.rows[0].recetas_id; //aca se captura el id de la receta para el post siguiente
	//aca se obtiene información del medicamento del formulario 
	let medicamento = await fetch(`http://localhost:4000/api/v1/buscarmedicamento/${medicamento0}`);
	medicamento = await medicamento.json();
	let id_medicamento = medicamento.rows[0].id_medicamento;//captura del id del medicamento para el post
	//se envian los datos del post para insertar el detalle de receta
	let result2 = await fetch('http://localhost:4000/api/v1/anadirReceta', {
		method: "POST",
		body: JSON.stringify({ id_receta, medicamento0, id_medicamento, prescripcion }),
		headers: { "Content-Type": "application/json" }
	})
	res.render('medico', { message: "Receta Añadida Exitosamente" });
});

router.post('/modificar/', async (req, res) => { //metodo post para modificar recetas
	let id = req.body.id; // id de la receta
	let medicamento = req.body.medicamento;
	let prescripcion = req.body.prescripcion;
	//se obtienen los datos del formulario
	//y se envia y espera respuesta de la API
	let resultmedicamento = await fetch(`http://localhost:4000/api/v1/buscarmedicamento/${medicamento}`)
	resultmedicamento = await resultmedicamento.json();
	let id_medicamento = resultmedicamento.rows[0].id_medicamento; // se captura el id del medicamento
	let result2 = await fetch('http://localhost:4000/api/v1/modificar', {
		method: "PUT",
		body: JSON.stringify({ id, medicamento, id_medicamento, prescripcion }),
		headers: { "Content-Type": "application/json" }
	});
	res.render('medico', { message: "Receta Modificada con exito" })
});

router.post('/eliminar/', async (req, res) => { // eliminar resetas
	let id = req.body.id; //id de receta
	//se toma el valor del id de la receta de los botones 
	// eliminar receta_detalle
	let result = await fetch(`http://localhost:4000/api/v1/eliminarRecetaDetalle/${id}`, {
		method: "DELETE",
		body: JSON.stringify({ id }),
		headers: { "Content-Type": "application/json" }
	});
	//eliminar recetas
	let result2 = await fetch(`http://localhost:4000/api/v1/eliminarReceta/${id}`, {
		method: "DELETE",
		body: JSON.stringify({ id }),
		headers: { "Content-Type": "application/json" }
	});
	res.render('medico', { message: "Receta Eliminada con exito" })
});

router.post('/anadirmedicamento', async (req, res) => {  // añade nuevos medicamentos en la base de datos
	let nombre = req.body.name;
	let contenido = req.body.content;
	const result = await fetch("http://localhost:4000/api/v1/anadirmedicamento", {
		method: "POST",
		body: JSON.stringify({ nombre, contenido }),
		headers: { "Content-Type": "application/json" }
	});
	res.render('medico', { message: "Medicamento Añadido Exitosamente" })
});

// router.post('/modificarusuario', async (req, res) => { modificar usuario no funcionando
// 	let id = req.body.id;
// 	let rutusuario = req.body.rut_usuario;
// 	let username = req.body.username;
// 	let password = req.body.password;

// 	console.log(rutusuario);
// 	console.log(username);
// 	console.log(password);

// 	console.log(id);
// 	let result = await fetch(`http://localhost:4000/api/v1/modificarusuario`, {
// 		method: "PUT",
// 		body: JSON.stringify({ id, rutusuario, username, password }),
// 		headers: { "Content-Type": "application/json" }
// 	})
// 	console.log(result);
// 	res.render('admin', { mesagge: "Usuario Borrado Con Éxito" })
// });

// router.post('/eliminarusuario', async (req, res) => { eliminar usuario no funcionando
// 	let id = req.body.id;
// 	console.log(id);
// 	let result = await fetch(`http://localhost:4000/api/v1/eliminarusuario/${id}`, {
// 		method: "POST",
// 		body: JSON.stringify({ id }),
// 		headers: { "Content-Type": "application/json" }
// 	})
// 	res.render('admin', { mesagge: "Usuario Borrado Con Éxito" })
// });

export default router;