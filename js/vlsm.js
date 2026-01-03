$(document).ready(function () {
  $("#calcularVLSM").click(function (e) {
    e.preventDefault();

    // obtenemos y validamos la IP base y la máscara
    const ipBase = $("#address").val().trim();
    const netmask = parseInt($("#netmask").val());

    if (!validarIP(ipBase)) {
      alert("Dirección IP no válida");
      return;
    }

    // obtenemos los datos de las subredes (nombre y # de hosts) y lo guardamos en un array
    const subredes = [];
    $(".subredGrupo").each(function (i) {
      const nombre = $(this).find(`input[id^="subnetName"]`).val();
      const hosts = parseInt($(this).find(`input[id^="subnetHost"]`).val());
      if (!isNaN(hosts) && hosts > 0) {
        subredes.push({ nombre, hosts });
      }
    });

    // realizamos el cálculo VLSM
    const resultados = calcularVLSM(ipBase, netmask, subredes);
    mostrarTablaVLSM(resultados);
  });
});

function calcularVLSM(ipBase, netmask, subredes) {
  // ordena subredes por tamaño (mayor a menor).
  // esto es necesario para VLSM
  subredes.sort((a, b) => b.hosts - a.hosts);

  const resultados = []; // array para almacenar los resultados de cada subred
  let ipActual = ipToInt(ipBase);

  // iterar sobre cada subred para asignarle un bloque de IPs
  for (let i = 0; i < subredes.length; i++) {
    const { nombre, hosts } = subredes[i];

    // 2^n - 2 >= hosts, donde n es el número de bits que se pueden usar para hosts
    let n = 0;
    while (Math.pow(2, n) - 2 < hosts) {
      n++;
    }

    // calcular la nueva máscara para la subred
    // calcular bit para la subred, usando R = (32 - netmask) - n
    const R = 32 - netmask - n;
    const nuevaMascaraBits = netmask + R;
    const mascaraDecimal = bitsToDecimalMask(nuevaMascaraBits);

    // determinar: subred, primera y última IP útil, e IP de broadcast
    const ipSubred = intToIp(ipActual);
    const primerHost = intToIp(ipActual + 1);
    const ultimoHost = intToIp(ipActual + Math.pow(2, n) - 2);
    const broadcast = intToIp(ipActual + Math.pow(2, n) - 1);

    resultados.push({
      subred: nombre,
      hosts,
      ipSubred,
      mascaraBits: nuevaMascaraBits,
      mascaraDecimal,
      primerHost,
      ultimoHost,
      broadcast,
    });

    ipActual += Math.pow(2, n); // siguiente salto
  }

  return resultados;
}

// convertir IP string a entero
function ipToInt(ip) {
  // dividir la IP por octetos, y acumular el valor desplazando bits.
  return ip.split(".").reduce((acc, oct) => (acc << 8) + parseInt(oct), 0);
}

// convertir entero a IP string
function intToIp(int) {
  // realiza desplazamientos de bits y operaciones AND para extraer cada octeto
  return [int >>> 24, (int >>> 16) & 255, (int >>> 8) & 255, int & 255].join(
    "."
  );
}

// convertir mascara CIDR (bits) a decimal
function bitsToDecimalMask(bits) {
  const mask = [];
  for (let i = 0; i < 4; i++) {
    const block = Math.min(8, bits - i * 8);
    mask.push(block > 0 ? 256 - Math.pow(2, 8 - block) : 0);
  }
  return mask.join(".");
}

// regex para validar formato de IPv4 (nota: igual podriamos hacerlo para IPv6, pero depende del profe)
function validarIP(ip) {
  const regex =
    /^(25[0-5]|2[0-4][0-9]|1\d{2}|[1-9]?\d)\.(25[0-5]|2[0-4][0-9]|1\d{2}|[1-9]?\d)\.(25[0-5]|2[0-4][0-9]|1\d{2}|[1-9]?\d)\.(25[0-5]|2[0-4][0-9]|1\d{2}|[1-9]?\d)$/;
  return regex.test(ip);
}

// Mostrar los resultados en una tabla dentro del archivo HTML
function mostrarTablaVLSM(resultados) {
  const tablaDiv = $("#tablaVLSM");
  tablaDiv.empty(); // Limpiar resultados anteriores, para evitar duplicados

  if (!resultados || resultados.length === 0) {
    tablaDiv.html("<p>No hay resultados para mostrar.</p>");
    return;
  }

  let tablaHTML = `
  <div class="card mt-4">
    <div class="card-body">
      <h2 class="card-title">Resultados VLSM</h2>
      <div class="table-responsive">
        <table class="table table-bordered table-striped">
          <thead class="table-secondary">
            <tr>
              <th>Subred</th>
              <th>Hosts Requeridos</th>
              <th>Dirección de Subred</th>
              <th>Máscara (Bits)</th>
              <th>Máscara (Decimal)</th>
              <th>Primera Host IP</th>
              <th>Último Host IP</th>
              <th>IP de Broadcast</th>
            </tr>
          </thead>
          <tbody>
`;

  resultados.forEach((res) => {
    tablaHTML += `
            <tr>
                <td>${res.subred}</td>
                <td>${res.hosts}</td>
                <td>${res.ipSubred}</td>
                <td>/${res.mascaraBits}</td>
                <td>${res.mascaraDecimal}</td>
                <td>${res.primerHost}</td>
                <td>${res.ultimoHost}</td>
                <td>${res.broadcast}</td>
            </tr>
        `;
  });

  tablaHTML += `
            </tbody>
        </table>
      </div>
    </div>
  </div>
`;

  tablaDiv.html(tablaHTML); // insertar tabla en el DOM
}
