// --- Funciones auxiliares para manipulación de IPs --- //

/**
 * Valida que una IP tenga el formato correcto (IPv4).
 * @param {string} ipString
 * @returns {boolean}
 */
function validarIP(ipString) {
  const octetos = ipString.split(".");
  return octetos.length === 4 && octetos.every(o => !isNaN(o) && o >= 0 && o <= 255);
}

/**
 * Convierte el prefijo CIDR a una máscara en forma de array.
 * @param {number} cidr
 * @returns {number[]}
 */
function calcularMascaraDesdeCIDR(cidr) {
  const binario = "1".repeat(cidr).padEnd(32, "0");
  return binario.match(/.{1,8}/g).map(b => parseInt(b, 2));
}

/**
 * Calcula la dirección de red a partir de una IP y su máscara.
 */
function calcularDireccionRed(ip, mascara) {
  return ip.map((octeto, i) => octeto & mascara[i]);
}

/**
 * Calcula la dirección de broadcast a partir de una IP y su máscara.
 */
function calcularDireccionBroadcast(ip, mascara) {
  return ip.map((octeto, i) => octeto | (~mascara[i] & 255));
}

/**
 * Convierte un array de 4 octetos a una cadena de IP.
 */
function arrayAStringIP(ipArray) {
  return ipArray.join(".");
}

/**
 * Convierte una IP a decimal.
 */
function ipToDecimal(ip) {
  return ip[0] * (2 ** 24) + ip[1] * (2 ** 16) + ip[2] * (2 ** 8) + ip[3];
}

/**
 * Convierte un número decimal a una IP.
 */
function decimalToIP(decimal) {
  return [
    (decimal >>> 24) & 255,
    (decimal >>> 16) & 255,
    (decimal >>> 8) & 255,
    decimal & 255,
  ];
}

/**
 * Suma 1 a una dirección IP.
 */
function sumarUnoAIP(ip) {
  return decimalToIP(ipToDecimal(ip) + 1);
}

/**
 * Resta 1 a una dirección IP.
 */
function restarUnoAIP(ip) {
  return decimalToIP(ipToDecimal(ip) - 1);
}

/**
 * Calcula cuántos hosts disponibles tiene una subred.
 */
function calcularHostsDisponibles(cidr) {
  const bitsHost = 32 - cidr;
  return bitsHost >= 2 ? Math.pow(2, bitsHost) - 2 : 0;
}

/**
 * Calcula la cantidad de bits extra necesarios para dividir en 'n' subredes.
 */
function bitsNecesariosParaSubredes(cantidad) {
  let bits = 0;
  while (Math.pow(2, bits) < cantidad) bits++;
  return bits;
}

// --- Función principal unificada --- //

function calcularSubredesCIDR() {
  const ipStr = document.getElementById("ipInput").value.trim();
  const cidrOriginal = Number(document.getElementById("cidrInput").value);
  const cantidadSubredes = document.getElementById("subnetCount").value.trim();
  const output = document.getElementById("results");

  if (!validarIP(ipStr)) {
    output.innerHTML = "<p style='color:red;'>IP inválida</p>";
    return;
  }

  const ipBase = ipStr.split(".").map(Number);
  const direccionRedOriginal = calcularDireccionRed(ipBase, calcularMascaraDesdeCIDR(cidrOriginal));
  const ipDecimalBase = ipToDecimal(direccionRedOriginal);

  // Si no se especifica cantidad de subredes, mostrar solo una red
  if (cantidadSubredes === "") {
    const mascara = calcularMascaraDesdeCIDR(cidrOriginal);
    const red = direccionRedOriginal;
    const broadcast = calcularDireccionBroadcast(red, mascara);
    const ipInicial = sumarUnoAIP(red);
    const ipFinal = restarUnoAIP(broadcast);
    const hosts = calcularHostsDisponibles(cidrOriginal);

    output.innerHTML = `
      <h3>Información de la red /${cidrOriginal}</h3>
      <table border="1" cellpadding="6" cellspacing="0">
        <tr><th>Red</th><th>IP Inicial</th><th>IP Final</th><th>Broadcast</th><th>Hosts</th><th>Máscara</th></tr>
        <tr>
          <td>${arrayAStringIP(red)}</td>
          <td>${arrayAStringIP(ipInicial)}</td>
          <td>${arrayAStringIP(ipFinal)}</td>
          <td>${arrayAStringIP(broadcast)}</td>
          <td>${hosts}</td>
          <td>${arrayAStringIP(mascara)}</td>
        </tr>
      </table>
    `;
    return;
  }

  // Si se especifica una cantidad, dividir en subredes
  const cantidad = Number(cantidadSubredes);
  const bitsAdicionales = bitsNecesariosParaSubredes(cantidad);
  const nuevoCIDR = cidrOriginal + bitsAdicionales;

  if (nuevoCIDR > 32) {
    output.innerHTML = "<p style='color:red;'>No es posible crear tantas subredes con ese prefijo.</p>";
    return;
  }

  const nuevaMascara = calcularMascaraDesdeCIDR(nuevoCIDR);
  const totalSubredes = Math.pow(2, bitsAdicionales);
  const direccionesPorSubred = Math.pow(2, 32 - nuevoCIDR);

  let tablaSubredes = "";
  for (let i = 0; i < cantidad; i++) {
    const subredDecimal = ipDecimalBase + (i * direccionesPorSubred);
    const subred = decimalToIP(subredDecimal);
    const red = calcularDireccionRed(subred, nuevaMascara);
    const broadcast = calcularDireccionBroadcast(subred, nuevaMascara);
    const ipInicial = sumarUnoAIP(red);
    const ipFinal = restarUnoAIP(broadcast);
    const hosts = calcularHostsDisponibles(nuevoCIDR);

    tablaSubredes += `
      <tr>
        <td>${arrayAStringIP(red)}</td>
        <td>${arrayAStringIP(ipInicial)}</td>
        <td>${arrayAStringIP(ipFinal)}</td>
        <td>${arrayAStringIP(broadcast)}</td>
        <td>${hosts}</td>
        <td>${arrayAStringIP(nuevaMascara)}</td>
      </tr>
    `;
  }

  output.innerHTML = `
  <div class="text-center mt-5">
    <h3 class="mb-4">Subredes generadas (${cantidad}) con prefijo /${nuevoCIDR}</h3>
    <div class="table-responsive d-flex justify-content-center">
      <table class="table table-bordered table-striped table-hover w-auto text-center shadow">
        <thead class="table-dark">
          <tr>
            <th>Red</th>
            <th>IP Inicial</th>
            <th>IP Final</th>
            <th>Broadcast</th>
            <th>Hosts</th>
            <th>Máscara</th>
          </tr>
        </thead>
        <tbody>
          ${tablaSubredes}
        </tbody>
      </table>
    </div>
  </div>
`;
}

// --- Evento para ejecutar el cálculo al hacer clic --- //
documentdocument.addEventListener("DOMContentLoaded", function() {
  const botonCalcular = document.getElementById("cargarScript");
  if (botonCalcular) {
    botonCalcular.addEventListener("click", calcularSubredesCIDR);
  }
});

