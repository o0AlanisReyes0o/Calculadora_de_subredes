$(document).ready(function () {
  function activarPestaña(tab) {
    $('.tab').removeClass('active');
    $('.seccion').addClass('hidden');

    if (tab === 'CIDR') {
      $('#tabCIDR').addClass('active');
      $('#cidrSection').removeClass('hidden');
    } else {
      $('#tabVLSM').addClass('active');
      $('#vlsmSection').removeClass('hidden');
    }
  }

  $('#tabCIDR').click(() => activarPestaña('CIDR'));
  $('#tabVLSM').click(() => activarPestaña('VLSM'));

  // Botón borrar CIDR
  $('.borrarCIDR').click(() => {
    $('#ipInput').val('');
    $('#cidrInput').val('');
    $('#subnetCount').val('');
    $('#results').empty();
  });

  // Botón borrar VLSM
  $('.borrarVLSM').click(() => {
    $('#ipForm')[0].reset();
    $('#subnetFields').empty();
    $('#tablaVLSM').empty();
  });

  // No se inicializa ninguna pestaña automáticamente
  // El usuario debe seleccionar CIDR o VLSM
});
