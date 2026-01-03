$(document).ready(function () {
    $('#agregarSubredes').click(function () {
        const cantidad = parseInt($('#subnets').val());

        // validando la cantidad de subredes
        if (isNaN(cantidad) || cantidad < 1) {
            alert('Ingresa un número válido de subredes (mínimo 1)');
            return;
        }

        // limpiando los campos existentes
        $('#subnetFields').empty();

        // genera nuevos campos
        for (let i = 1; i <= cantidad; i++) {
            const campo = `
                <div class="subredGrupo">
                    <label for="subnetName${i}">Nombre de subred ${i}:</label>
                    <input type="text" id="subnetName${i}" name="subnetName${i}" required autocomplete="off">
                    <label for="subnetHost${i}">Número de hosts:</label>
                    <input type="number" id="subnetHost${i}" name="subnetHost${i}" min="1" required autocomplete="off"><br>
                </div>
            `;
            $('#subnetFields').append(campo);
        }
    });
});
