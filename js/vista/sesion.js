// VISTA · Pantalla de inicio de sesión y registro.

// Muestra la pantalla de sesión (o la app, si visible = false)
function mostrarPantallaSesion(visible) {
  $('pantallaSesion').hidden = !visible;
}

// Cambia entre "Entrar" y "Crear cuenta"
function mostrarPestana(cual) {
  $('formEntrar').hidden = cual !== 'entrar';
  $('formCrear').hidden = cual !== 'crear';
  $('pestanaEntrar').classList.toggle('activo', cual === 'entrar');
  $('pestanaCrear').classList.toggle('activo', cual === 'crear');
  mostrarErrorSesion('');
}

function mostrarErrorSesion(mensaje) {
  $('errorSesion').textContent = mensaje;
}

function mostrarSaludo(usuaria) {
  $('saludo').textContent = `Hola, ${usuaria.nombre}`;
  $('contacto').value = usuaria.contacto || '';
}
