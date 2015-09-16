(function ($) {
  
	$.fn.colorbar = function (width, height, colorbarValues, minValue, maxValue) {
        var html = '<svg width="' + (width + 80) + '" height="' + height + '" > <g>';
        var rectHeight = height / colorbarValues.length;
        var rectWidth = width;
        for (var i=0 ; i < colorbarValues.length ; i++  ) {
         html = html + ' \n<rect style="fill:#' + colorbarValues[colorbarValues.length -1 - i] + ';fill-rule:evenodd;stroke:#000000;stroke-width:0px;stroke-opacity:0"'
               + ' id="rect' + i + '" width="' + rectWidth +'" height="' + rectHeight + '" x="0" y="' + i*rectHeight +'" />' ;
        }

        html = html + '<text x="' + (width +10) + '" y="' + (3*rectHeight +3) + '" font-family="sans-serif" font-size="15px" fill="black">' + maxValue + '</text>' ;
        html = html + '<text x="' + (width +10) + '" y="' + height + '" font-family="sans-serif" font-size="15px" fill="black">' + minValue + '</text>' ;
        html = html + '</g> </svg>';
        $(this).append(html);
		}
    
}(jQuery));

    
