		function createBrainHeatmaps(atlasFile,ontology,regionData, location,spreadsheetkey, minValue, maxValue, colormap, default_color) {

			$.getJSON(atlasFile, function(atlasesData) {
                var atlasData ;
                for (var i=0; i< atlasesData.length; i++  ) 
                    { 
                        if (atlasesData[i]["atlas"] == ontology) { atlasData = atlasesData[i]; }
                    }

                var numberOfImages = atlasData["images"].length;
                $('#totalImageCount').html('/ ' + numberOfImages);

                var fileName = atlasData["directory"] + "/" + location + ".svg";
                $.get(fileName, null, function(data){
                    
                    var svgNodeSource = $("svg", data);
                    svgNodeSource.attr('id', "svgDrawingSource").css({'width':'50%', 'height':'50%'});
                    var docNodeSource = svgNodeSource[0];
                    $("#page_div").append(svgNodeSource);

                    ontologyFile = "ontology/" + ontology + ".json";
                    $.getJSON(ontologyFile, function(ontologyData) {		
                           drawStuff(regionData,minValue,maxValue,colormap,default_color,ontologyData,atlasData, docNodeSource) ;
                    },'xml');

                    });
                
                $.get(fileName, null, function(data){

                    var svgNodeDestination = $("svg", data);
                    svgNodeDestination.attr('id', "svgDrawingDestination").css({'width':'50%', 'height':'50%'});
                    var docNodeDestination = svgNodeDestination[0];
                    $("#page_div").append(svgNodeDestination);

                    ontologyFile = "ontology/" + ontology + ".json";
                    $.getJSON(ontologyFile, function(ontologyData) {		
                           drawStuff(regionData,minValue,maxValue,colormap,default_color,ontologyData,atlasData, docNodeDestination) ;
                    },'xml');

                    });
            });
        }

		function drawStuff(valuesAndMinMax,minValue,maxValue,colormap,default_color,ontologyData,atlasData,svgNode) {
		   if ( "null" != minValue ) { valuesAndMinMax.minValue = minValue ; }
		   if ( "null" != maxValue ) { valuesAndMinMax.maxValue = maxValue ; }
		   $("#colorbar_div").html( drawColorbar(20, 200, colormap, valuesAndMinMax.minValue , valuesAndMinMax.maxValue) ) ;
		   var colorDict = translateNumberToColor(valuesAndMinMax.valuesDict, valuesAndMinMax.minValue,valuesAndMinMax.maxValue,colormap);
		   getStructureColor(ontologyData, colorDict, default_color,svgNode);
		   $('#loader').hide();
		   encode_as_img_and_link(atlasData);
		}
		function getURLParameter(name) {
		    return decodeURI(
			(RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
		    );
		}

		function setColor(structure_id, color,showOutline,svgNode)
		{
			//var	svgContainer = document.getElementById("svgDrawing");
            var	svgContainer = svgNode;
			var svgElement = getElementByAttribute('structure_id',structure_id,svgContainer);
			if (!(svgElement == null)) {
				svgElement.style.fill = color; 
				if (!showOutline) { svgElement.style.stroke = "#f2f1f0";}
			}
		}

		function getStructureColor(data,valuesDict, default_color, svgNode)
		{// this function iterates over the regions in the data. For each region it checks if it has a value if not it takes the value from its parent

			var currentStructID,parentStructID,currentValue,parentValue;
			currentStructID = data[0]['id'];
			valuesDict[currentStructID] = default_color;
			var showOutline = true;
			for (var i=1; i< data.length; i++  ) 
			{
				currentStructID = data[i]['id'];
				parentStructID = data[i]['parent_structure_id'];
				showOutline = true;
				if ( !(currentStructID in valuesDict) ){
  				   parentValue = valuesDict[parentStructID];
				   if (parentValue == null) {
				      valuesDict[currentStructID] = default_color;
				      }
			           else {
				      valuesDict[currentStructID] = parentValue;
					  if ( !(default_color == parentValue)) {showOutline = false;}
				      }
				   }
				setColor(currentStructID, valuesDict[currentStructID] ,showOutline, svgNode);
			}
		}

		function translateNumberToColor(values, minValue,maxValue,colormap)
		{
			var colorDict = {};
			var current_value , releventIndexInColorMap;
			var colormap_size = colormap.length;
			
			for(var index in values) {
			  current_value =  values[index];
			  releventIndexInColorMap = 	(values[index]	- minValue ) / 	 (maxValue - minValue) * (colormap_size -1); 
			  releventIndexInColorMap = Math.round(releventIndexInColorMap);
			  colorDict[index] =  colormap[releventIndexInColorMap];
			  colorDict[index] = '#' + colorDict[index];
			}
			return colorDict;
		}

		function getValuesAndMinMax(data)
		{
			var minValue = NaN;
			var maxValue = NaN;
			var valuesDict = {};
			var currentValue,currentStructID,numberValue;		
				
			for (var i=0; i< data.feed.entry.length; i++  ) 
			{
				currentValue = data.feed.entry[i]['gsx$value']['$t'];
				currentStructID = data.feed.entry[i]['gsx$id']['$t'];
				if (!(currentValue == '' ))				{
					valuesDict[currentStructID] = currentValue;
					numberValue = parseFloat(currentValue);
					if (isNaN(minValue)) {
						minValue = numberValue;
						}
					else {
						if (minValue > numberValue) {
							minValue = numberValue;
							}
					};

					if (isNaN(maxValue)) {
						maxValue = numberValue;
						}
					else {
						if (maxValue < numberValue) {
							maxValue = numberValue;
							}
					};
				}
			}

			return {
				'valuesDict' : valuesDict, 
				'minValue' : minValue, 
				'maxValue' : maxValue
			    };  
		}

		function getElementByAttribute(attr, value, root) {
			root = root || document.body;
			if (root.attributes) {
				if(root.hasAttribute(attr) && root.getAttribute(attr) == value) {
					return root;
				}
			}
			else {
					return null;
			}
	
			var children = root.childNodes, 
				element;
			for(var i = children.length; i--; ) {
				element = getElementByAttribute(attr, value, children[i]);
				if(element) {
				    return element;
				}
			}
			return null;
		}
		
		function changeSlice(numberOfImages) {
			var location = getURLParameter('location');
			location = parseFloat(location);
			var spreadsheetkey = getURLParameter('spreadsheetkey');
			var ontology = getURLParameter('ontology');
			var minValue = getURLParameter('min');
			var maxValue = getURLParameter('max');
			location = location + numberOfImages;
			if (location < 1) {
				location = 1;
			}
			redirectToPage(location, spreadsheetkey,ontology, minValue, maxValue);
		}

		function goToSlice() {
			var location = $('#currentLocation').val();
			location = parseFloat(location);
			var spreadsheetkey = getURLParameter('spreadsheetkey');
			var ontology = getURLParameter('ontology');
			var minValue = getURLParameter('min');
			var maxValue = getURLParameter('max');
			if (location < 1) {
				location = 1;
			}
			redirectToPage(location, spreadsheetkey, ontology, minValue, maxValue);
		}

		function redirectToPage(location, spreadsheetkey,ontology, minValue, maxValue) {
			window.location.href = "?location="  +location + "&ontology=" + ontology +"&min=" + minValue +"&max=" + maxValue + "&spreadsheetkey=" + spreadsheetkey ;
		}

		function encode_as_img_and_link(atlasData){
			var atlasName = atlasData["atlas"];
			var location = getURLParameter('location');
			 // Add some critical information
			 $("svg").attr({ version: '1.1' , xmlns:"http://www.w3.org/2000/svg"});

			 var svg = $("#page_div").html();
			 var b64 = Base64.encode(svg); // or use btoa if supported

			 // Works in Firefox 3.6 and Webit and possibly any browser which supports the data-uri
			 $("#buttonsAndStuff").append($("<a href-lang='image/svg+xml' href='data:image/svg+xml;base64,\n"+b64+"' title='file.svg' download='" + atlasName + "-" + location + ".svg'>Download</a>"));
		}

		function drawColorbar(width, height, colorbarValues, minValue, maxValue) {
			var html = '<svg width="' + (width + 80) + '" height="' + height + '" > <g>';
			var rectHeight = height / colorbarValues.length;
			var rectWidth = width;
			for (var i=0 ; i < colorbarValues.length ; i++  ) {
			 html = html + ' \n<rect style="fill:#' + colorbarValues[colorbarValues.length -1 - i] + ';fill-rule:evenodd;stroke:#000000;stroke-width:0px;stroke-opacity:0"'
				   + ' id="rect' + i + '" width="' + rectWidth +'" height="' + rectHeight + '" x="0" y="' + i*rectHeight +'" />' ;
			}

			/*
			for (var j=0 ; j <= 5 ; j++  ) {
			    html = html + '<text x="' + (width +10) + '" y="' + (3*rectHeight + j* (height -3*rectHeight)/5) + '" font-family="sans-serif" font-size="15px" fill="black">' + (maxValue - j/5*(maxValue -minValue) ).toFixed(2) + '</text>' ;
			}
			*/

			html = html + '<text x="' + (width +10) + '" y="' + 3*rectHeight  + '" font-family="sans-serif" font-size="15px" fill="black">' + maxValue + '</text>' ;
			html = html + '<text x="' + (width +10) + '" y="' + height + '" font-family="sans-serif" font-size="15px" fill="black">' + minValue + '</text>' ;
			html = html + '</g> </svg>';
			return html;
		}
