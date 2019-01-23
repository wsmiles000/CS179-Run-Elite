var map,
    currentPosition,
    directionsDisplay,
    directionsService;

function initialize(lat, lon)
{
    directionsDisplay = new google.maps.DirectionsRenderer();
    directionsService = new google.maps.DirectionsService();

    currentPosition = new google.maps.LatLng(lat, lon);

    map = new google.maps.Map(document.getElementById('map_canvas'), {
       zoom: 15,
       center: currentPosition,
       mapTypeId: google.maps.MapTypeId.ROADMAP
     });

    directionsDisplay.setMap(map);

     var currentPositionMarker = new google.maps.Marker({
        position: currentPosition,
        map: map,
        title: "Current position"
    });

    var infowindow = new google.maps.InfoWindow();
    google.maps.event.addListener(currentPositionMarker, 'click', function() {
        infowindow.setContent("Current position: latitude: " + lat +" longitude: " + lon);
        infowindow.open(map, currentPositionMarker);
    });
}

function locError(error) {
    // initialize map with a static predefined latitude, longitude
   initialize(59.3426606750, 18.0736160278);
}

function locSuccess(position) {
    initialize(position.coords.latitude, position.coords.longitude);
}

var path = "";

function calculateRoute() {
    var start = $("#start").val();
    var end = $("#end").val();
    if (start && start != '' && end && end != '') {
        var request = {
            origin:start,
            destination:end,
            travelMode: google.maps.DirectionsTravelMode["WALKING"]
        };

        directionsService.route(request, function(response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                directionsDisplay.setPanel(document.getElementById("directions"));
                directionsDisplay.setDirections(response);
                path = response.routes[0].overview_path;
                calculateElevation(path);
                $("#results").show();
            }
            else {
                $("#results").hide();
            }
        });
    }
    else {
        $("#results").hide();
    }
}

function calculateElevation(path) {
  var elevator = new google.maps.ElevationService;

  elevator.getElevationAlongPath({
    'path':path,
    'samples': 256
  }, plotElevation);
}

function plotElevation(elevations, status) {
  var chartDiv = document.getElementById('elevation_chart');
  if (status !== 'OK') {
    // Show the error code inside the chartDiv.
    chartDiv.innerHTML = 'Cannot show elevation: request failed because ' +
        status;
    return;
  }
  // Create a new chart in the elevation_chart DIV.

  var chart = new google.visualization.ColumnChart(chartDiv);

  // Extract the data from which to populate the chart.
  // Because the samples are equidistant, the 'Sample'
  // column here does double duty as distance along the
  // X axis.
  var data = new google.visualization.DataTable();
  data.addColumn('string', 'Sample');
  data.addColumn('number', 'Elevation');
  for (var i = 0; i < elevations.length; i++) {
    data.addRow(['', elevations[i].elevation]);
  }

  // Draw the chart using the data within its DIV.
  chart.draw(data, {
    height: 150,
    width: '100%',
    legend: 'none',
    titleY: 'Elevation (m)'
  });

  // event handler to change chart size when window size shifts
  $(window).resize(function() {
    if(this.resizeTO) clearTimeout(this.resizeTO);
    this.resizeTO = setTimeout(function() {
        $(this).trigger('resizeEnd');
    }, 200);
  });

  // redraw graph when window resize is completed
  $(window).on('resizeEnd', function() {
    chart.draw(data, {
      height: 150,
      width: '100%',
      legend: 'none',
      titleY: 'Elevation (m)'
    });
  });
}

$(document).on("pagebeforeshow", function() {
    navigator.geolocation.getCurrentPosition(locSuccess, locError);
});

$(document).on('click', '#directions-button', function(e){
    e.preventDefault();
    calculateRoute();
});
