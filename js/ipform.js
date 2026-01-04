$(document).ready(function () {
    $('#agregarSubredes').click(function () {
        // Limpiar errores previos
        $('.error-message').remove();
        $('.is-invalid').removeClass('is-invalid');
        
        const cantidad = parseInt($('#subnets').val());

        // validando la cantidad de subredes
        if (isNaN(cantidad) || cantidad < 1) {
            mostrarErrorEnCampoSubredes('Por favor, ingrese un número válido de subredes (mínimo 1).');
            return;
        }

        // Validar máximo razonable de subredes
        if (cantidad > 50) {
            mostrarErrorEnCampoSubredes('El número máximo de subredes permitido es 50.');
            return;
        }

        // limpiando los campos existentes
        $('#subnetFields').empty();

        // genera nuevos campos
        for (let i = 1; i <= cantidad; i++) {
            const campo = `
                <div class="subredGrupo">
                    <label for="subnetName${i}">Nombre de subred ${i}:</label>
                    <input type="text" id="subnetName${i}" name="subnetName${i}" required autocomplete="off" ">
                    <label for="subnetHost${i}">Número de hosts:</label>
                    <input type="number" id="subnetHost${i}" name="subnetHost${i}" min="1" required autocomplete="off" "><br>
                </div>
            `;
            $('#subnetFields').append(campo);
        }

        // Mostrar mensaje de éxito
        mostrarAlertaTemporal(`Se agregaron ${cantidad} subred(es) correctamente. Complete los campos.`, 'success');
    });
});

// Función para mostrar error debajo del campo de subredes
function mostrarErrorEnCampoSubredes(mensaje) {
    const campo = $('#subnets');
    campo.addClass('is-invalid');
    const errorHTML = `<div class="invalid-feedback d-block error-message">${mensaje}</div>`;
    campo.after(errorHTML);
    campo[0].scrollIntoView({ behavior: "smooth", block: "center" });
    campo.focus();
}

// Función para mostrar alertas temporales
function mostrarAlertaTemporal(mensaje, tipo = 'info') {
    const alertHTML = `
        <div class="alert alert-${tipo} alert-dismissible fade show" role="alert" id="alertaTemporal">
            <strong>${tipo === 'success' ? '' : tipo === 'warning' ? '' : 'ℹ'}</strong> ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    // Remover alerta anterior si existe
    $('#alertaTemporal').remove();
    
    // Insertar nueva alerta antes de los campos de subredes
    $('#subnetFields').before(alertHTML);
    
    // Auto-cerrar después de 4 segundos
    setTimeout(function() {
        $('#alertaTemporal').fadeOut('slow', function() {
            $(this).remove();
        });
    }, 4000);
}
