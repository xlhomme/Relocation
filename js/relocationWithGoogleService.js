var map;
var geocoder;

var markersArray = [];


var destinationIcon = 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=D|FF0000|000000';
var originIcon = 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=O|FFFF00|000000';

 var service = new google.maps.DirectionsService();
 
// delay between geocode requests - at the time of writing, 100 miliseconds seems to work well
var delay = 100;
var CodePostOnly = false;
var startIndex = 0;
var currentIndex = 0;
var maxIndex = 0;
var dataArray = [] ; 
var nbQuery = 0; 



function calcDistance(num, next) {

	var element = dataArray[num];

	// On ne traite plus les éléments qui ont une distance déjà calculé
	while (element.hasOwnProperty('Distance') && element.Distance != '' )
	{
			num++;
			currentIndex++;
			element = dataArray[num];
	}
		
		
	
    var myorigin  = element.Adresse + "," +  element.CODPOST ;
	if (CodePostOnly == false)
		myorigin  +=  " " + element.Ville;
  
	element.Distance = 0.0;
	element.Duration = 0.0;
	
	var fromAdr = document.getElementById('fromAdr').value;
	var travelModeAuto = document.getElementById('Auto').checked;
	
	var request = {
      origin: myorigin,
      destination: fromAdr,
	  unitSystem: google.maps.UnitSystem.METRIC,
      avoidHighways: false,
      avoidTolls: false,
	  provideRouteAlternatives: false,
	  /*transitOptions: {
		departureTime: Date.now()
	},*/
      travelMode: google.maps.TravelMode.DRIVING
	};
	if (travelModeAuto == false)
		request.travelMode= google.maps.TravelMode.TRANSIT;
		
 
	var directionsService = new google.maps.DirectionsService();
	directionsService.route(request, function (response,status)
	{
		nbQuery +=1;
		var outputDiv = document.getElementById('outputDiv');

		if (status != google.maps.DirectionsStatus.OK) 
		{
			if (status == google.maps.DirectionsStatus.OVER_QUERY_LIMIT) 
			{
				console.log ("OVER_QUERY_LIMIT");
                currentIndex--;
                delay+=5;
			}	
			else
			{ 
				if (status == google.maps.DirectionsStatus.NOT_FOUND) 
				{
					if (CodePostOnly==false)
					{
					console.log ("NOT_FOUND : " + currentIndex);
					currentIndex--;
					CodePostOnly=true;
					}
					else
					{ 
						CodePostOnly=false;
						outputDiv.innerHTML += '<b>Route Segment: ' + myorigin + " " + myorigin  + " " + status + '</b><br>';
					}
				}	
				else
				{ 
					CodePostOnly=false;
					outputDiv.innerHTML += '<b>Route Segment: ' + myorigin + " " + status + '</b><br>';
				}
			}
		} 
		else 
		{
			var str = currentIndex + " " + num + " " + myorigin +" " + myorigin;
			console.log (str);
			console.log (response);
        
			CodePostOnly=false; 
			var route = response.routes[0];
  			// For each route, display summary information.
			outputDiv.innerHTML += '<b>Route Segment: ' + currentIndex + '</b><br>';
			outputDiv.innerHTML += route.legs[0].start_address + ' to ';
			outputDiv.innerHTML += route.legs[0].end_address + '<br>';
			outputDiv.innerHTML += route.legs[0].distance.text + '<br>';
			outputDiv.innerHTML += route.legs[0].duration.text + '<br><br>';
			element.Distance = route.legs[0].distance.value;
			element.Duration = route.legs[0].duration.value;
		}
		
		next();
	}

  );
 
 
}

// Appel de la fonction calcDistance de manière aSynchrone avec un delay d'attente 
// permettant d'outrepasser la limite du nombre de requete par seconde 
function callASyncCalDistance() {
    if (currentIndex < maxIndex) {
	     setTimeout('calcDistance("'+ currentIndex++ +'",callASyncCalDistance)', delay); 
    } 
	
}

// When parse is completed
//
function callbackPapaparse( results) {
	 /*maxIndex  = results.data.length; 
	 dataArray = results.data;
	 for (var i=0;i<maxIndex;i++)
	 {
		var element = dataArray[i];
		var dest   = element.Adresse + "," +  element.CODPOST + " " + element.Ville;
		 calculateDistances(myorigin);
	 }*/
	 
	 maxIndex  = results.data.length; 
	 dataArray = results.data;
	 console.log(dataArray);
	 callASyncCalDistance();

}

// 
// this function use papaparse in order to parse the CSV file
function onFileLoad() {
	var  myFile = document.getElementById("uploadInput").files[0];
	Papa.parse(myFile, {
						header: true,
						complete: callbackPapaparse
					}
			);

}


// Appeller apres le chargement du fichier CSV
// Utilise l'API PAPAPARSE pour parcer le CSV et le Coder en JSON
// Ici le fichier CVS a des columne formaté
function onStore() {

	var csv = 	Papa.unparse(dataArray, {  delimiter: ";" } );

	var downloadLink = document.createElement("a");
	var blob = new Blob(["\ufeff", csv]);
	var url = URL.createObjectURL(blob);
	downloadLink.href = url;
	downloadLink.download = "data.csv";

	document.body.appendChild(downloadLink);
	downloadLink.click();
	document.body.removeChild(downloadLink);
}

// Main function called for iniitalizing 
function initialize() {
  var opts = {
    center: new google.maps.LatLng(48.8, 2.5),
    zoom: 10
  };
  map = new google.maps.Map(document.getElementById('map-canvas'), opts);
  geocoder = new google.maps.Geocoder();
}

google.maps.event.addDomListener(window, 'load', initialize);