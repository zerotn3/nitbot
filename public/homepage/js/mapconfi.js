$(document).ready(function(){
'use strict';

//** Map **//
function initialize() {
var myLatlng = new google.maps.LatLng(43.2448385,12.5583436);
var mapOptions = {
zoom: 7,
disableDefaultUI: true,
scrollwheel: false,
center: myLatlng,
styles: [
{
	featureType: 'all',
	stylers: [
	{ saturation: -80 }
	]
},{
featureType: 'water',
elementType: 'geometry',
stylers: [
{ color: '#c6cacd'}
]
},{
featureType: 'poi.business',
elementType: 'labels',
stylers: [
{ visibility: 'off' }
]
}
]            
}
var map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);

var image = 'images/map_marker.png';
var myLatLng = new google.maps.LatLng(43.2448385,12.5583436);
var beachMarker = new google.maps.Marker({
position: myLatLng,
map: map,
icon: image
});

}
google.maps.event.addDomListener(window, 'load', initialize);
});