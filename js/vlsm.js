$(document).ready(function () {
  $("#calcularVLSM").click(function (e) {
    e.preventDefault();

    // Limpiar mensajes de error previos
    $(".error-message").remove();
    $(".is-invalid").removeClass("is-invalid");
    $("#tablaVLSM").find(".alert").remove();

    // obtenemos y validamos la IP base y la máscara
    const ipBase = $("#address").val().trim();
    const netmask = parseInt($("#netmask").val());

    // Array para almacenar todos los errores
    const errores = [];

    // Validar que se ingresó una IP
    if (!ipBase) {
      errores.push({ campo: "#address", mensaje: "Por favor, ingrese una dirección IP." });
    } else if (!validarIP(ipBase)) {
      // Validar formato de IP
      errores.push({ campo: "#address", mensaje: "La dirección IP ingresada no es válida. Use el formato indicado anteriormente." });
    }

    // Validar que se ingresó una máscara
    if (isNaN(netmask)) {
      errores.push({ campo: "#netmask", mensaje: "Por favor, ingrese una máscara de red." });
    } else if (netmask < 1 || netmask > 30) {
      // Validar rango de máscara
      errores.push({ campo: "#netmask", mensaje: "La máscara de red debe estar entre /1 y /30." });
    }

    // obtenemos los datos de las subredes (nombre y # de hosts) y lo guardamos en un array
    const subredes = [];

    $(".subredGrupo").each(function (i) {
      const nombreInput = $(this).find(`input[id^="subnetName"]`);
      const hostsInput = $(this).find(`input[id^="subnetHost"]`);
      const nombre = nombreInput.val().trim();
      const hostsStr = hostsInput.val();
      const hosts = parseInt(hostsStr);

      if (!nombre) {
        errores.push({ campo: nombreInput, mensaje: `La subred ${i + 1} debe tener un nombre.` });
      } else if (!hostsStr || isNaN(hosts) || hosts < 1) {
        errores.push({ campo: hostsInput, mensaje: `Debe tener al menos 1 host.` });
      } else if (!isNaN(netmask) && hosts > Math.pow(2, 32 - netmask) - 2) {
        errores.push({ campo: hostsInput, mensaje: `Requiere más hosts (${hosts}) de los disponibles en la red /${netmask}.` });
      } else {
        subredes.push({ nombre, hosts });
      }
    });

    // Si hay errores, mostrarlos todos
    if (errores.length > 0) {
      errores.forEach(error => mostrarErrorEnCampo(error.campo, error.mensaje));
      return;
    }

    // Validar que se agregaron subredes
    if (subredes.length === 0) {
      $(".error-message").remove();
      mostrarErrorGeneral("Debe agregar al menos una subred. Haga clic en 'Agregar Subredes'.");
      return;
    }

    // realizamos el cálculo VLSM
    try {
      const resultados = calcularVLSM(ipBase, netmask, subredes);
      mostrarTablaVLSM(resultados);
    } catch (error) {
      mostrarErrorGeneral("Error al calcular VLSM: " + error.message);
    }
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

// Función para mostrar mensajes de error debajo de cada campo
function mostrarErrorEnCampo(campo, mensaje) {
  const $campo = $(campo);
  
  // Agregar clase de Bootstrap para campo inválido
  $campo.addClass("is-invalid");
  
  // Crear mensaje de error
  const errorHTML = `<div class="invalid-feedback d-block error-message">${mensaje}</div>`;
  
  // Insertar mensaje después del campo
  $campo.after(errorHTML);
  
  // Scroll hacia el campo con error
  $campo[0].scrollIntoView({ behavior: "smooth", block: "center" });
  
  // Enfocar el campo
  $campo.focus();
}

// Mostrar los resultados en una tabla dentro del archivo HTML
function mostrarTablaVLSM(resultados) {
  const tablaDiv = $("#tablaVLSM");
  tablaDiv.empty(); // Limpiar resultados anteriores, para evitar duplicados

  if (!resultados || resultados.length === 0) {
    mostrarErrorGeneral("No se pudieron generar resultados. Verifique los datos ingresados.");
    return;
  }

  // Mostrar mensaje de éxito
  const alertSuccess = `
    <div class="alert alert-success alert-dismissible fade show" role="alert">
      <strong>Éxito:</strong> Cálculo VLSM realizado correctamente.
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
  tablaDiv.append(alertSuccess);

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

// Función para mostrar errores generales en el área de resultados
function mostrarErrorGeneral(mensaje) {
  const alertHTML = `
    <div class="alert alert-danger alert-dismissible fade show" role="alert">
      <strong> Error:</strong> ${mensaje}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
  $("#tablaVLSM").html(alertHTML);
}
