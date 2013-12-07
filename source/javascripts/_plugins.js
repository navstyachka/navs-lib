Modernizr.load({
	test: Modernizr.input.placeholder,
	nope: ['vendor/jquery.placeholder.min.js'],
	complete: function() {
		if ( !Modernizr.input.placeholder ) {
			$('input, textarea').placeholder();
		}
	}
});



$(function () {


	/** Adding sliders */
	function slider (node) {
		node.slides({
			pagination: true,
			paginationClass: 'pagination',
			generateNextPrev: true
		});

	}
});




