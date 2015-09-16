(function($) {
  
	$.fn.brainmap = function (options) {
      
		var settings = {
            atlasFile:"atlas.json", 
            location : "20",
            minValue : "null",
            maxValue : "null",
            ontology : "human",
            default_color:"#f2f1f0",
            regionData: null,
            hide_navigation:false,
            colormap : ['6A0000','740000','7F0000','8A0000','940000','9F0000','AA0000','B40000','BF0000','C90000','D40000','DF0000','E90000','F40000','FF0000','FF0A00','FF1500','FF1F00','FF2A00','FF3500','FF3F00','FF4A00','FF5500','FF5F00','FF6A00','FF7400','FF7F00','FF8A00','FF9400','FF9F00','FFAA00','FFB400','FFBF00','FFC900','FFD400','FFDF00','FFE900','FFF400','FFFF00','FFFF0F','FFFF1F','FFFF2F','FFFF3F','FFFF4F','FFFF5F','FFFF6F','FFFF7F','FFFF8F','FFFF9F','FFFFAF','FFFFBF','FFFFCF','FFFFDF'] //Heat colormap
	
		};
	  
		if (options) {
		  jQuery.extend(settings,options);
		}
		
	   $(this).data('settings',settings);
       $(this).append(  createToolbar( this,  options.hide_navigation ) );
       $(this).addClass('svg_holder');
       $(this).find("#currentLocation").val(settings.location);
       
        this.changeRegionData = drawBrainHeatmaps;
       this.createBrainHeatmaps = createBrainPlaceholders;
       this.createColorBar = createColorBar;
       return(this);
	};

}(jQuery));


        function createToolbar(root_object, hide) {
            var settings = $(root_object).data('settings');
            var index = settings.index;
            
            var buttonsDiv = $(' <div id="buttonsAndStuff" ></div>') ;
            buttonsDiv.append( $('<button> &lArr; </button> ').click( function() {
                var newLocation = parseFloat(settings.location) -1;
                if (newLocation < 1) {
                    newLocation = 1;
                }
                $( root_object ).trigger( "locationChanged", [newLocation] );
            }));
            buttonsDiv.append( $( '<input type="text" id="currentLocation" style="width: 25px;" > </input> <span id="totalImageCount"> </span> '));
            buttonsDiv.append( $( '<button> &rArr; </button> ' ).click( function() {
                var newLocation = parseFloat(settings.location) +1;
                if (newLocation < 1) {
                    newLocation = 1;
                }
                $( root_object ).trigger( "locationChanged", [newLocation] );
            }));
            buttonsDiv.append( $( '<button>Go</button> ' ).click( function() {
                var newLocation = parseFloat($(root_object).find('#currentLocation').val());
                if (location < 1) { 
                    location = 1;
                }
                $( root_object ).trigger( "locationChanged", [newLocation] );
            }) );
            buttonsDiv.append( $(  '<img src="ajax-loader.gif" id="loader"> ' ));
            buttonsDiv.append( $("<a id='image_download' href-lang='image/svg+xml' title='file.svg' >Download Image</a>"));
            
            if (hide) {
               $(buttonsDiv).hide();
            }

            return buttonsDiv;
        
        }

		function createBrainPlaceholders(regionData) {
		    var settings = $(this).data('settings');
            if ( "null" != settings.minValue ) { regionData.minValue = settings.minValue ; }
		    if ( "null" != settings.maxValue ) { regionData.maxValue = settings.maxValue ; }
            $(this).data('regionData',regionData);
            
            var brain_map_object = this;
            
            // loads the atlas file which contains all the location of the images for 
            // this ontology.
			$.getJSON(settings.atlasFile, function(atlasesData) {
                var atlasData ;
                for (var i=0; i< atlasesData.length; i++  ) 
                    { 
                        if (atlasesData[i]["atlas"] == settings.ontology) { atlasData = atlasesData[i]; }
                    }

                var totalImageCount = atlasData["images"].length;
                $(brain_map_object).find('#totalImageCount').html('/ ' + totalImageCount);


		var svg_container = $('<div id="svgDrawing"  class="svgDrawing"></div>').appendTo(brain_map_object);
                brain_map_object.append('<span id="structure_info" class="structure_description"> details: </span>' );


                // loads the svg image for this specific slice.
                var fileName = atlasData["directory"] + "/" + settings.location + ".svg";
                $(svg_container).load(fileName, null, function(data){   
                    
                    
                     drawBrainHeatmaps(brain_map_object,regionData) ;
                    }).error(function(jqXHR, textStatus, errorThrown) {
                        console.log("------" + textStatus + "------");
                        console.log("error in getting svg image:" + fileName);
                        console.log("incoming Text " + jqXHR.responseText);
                    });
            }).error(function(jqXHR, textStatus, errorThrown) {
                console.log("------" + textStatus + "------");
                console.log("error in getting atlas json ");
                console.log("incoming Text " + jqXHR.responseText);
            })
           
            
        }

		function drawBrainHeatmaps(root_object, regionData) {
            
            
            $(root_object).find('#loader').show();
            var settings = $(root_object).data('settings');
            if ( "null" != settings.minValue ) { regionData.minValue = settings.minValue ; }
            if ( "null" != settings.maxValue ) { regionData.maxValue = settings.maxValue ; }
            $(root_object).data('regionData',regionData);

            var svgNode = $(root_object).find('#svgDrawing')[0];
            var colorDict = translateNumberToColor(regionData.valuesDict, regionData.minValue,regionData.maxValue,settings.colormap);
            
            var ontologyFile = "ontology/" + settings.ontology + ".json";
            
            $.getJSON(ontologyFile, function(ontologyData) {		
                   getStructureColor(root_object, ontologyData, colorDict,regionData.valuesDict , settings.default_color,svgNode);
                   encode_as_img_and_link(root_object);
                   $(root_object).find('#loader').hide();
            },'xml');
            
            
		}

		function setColor(svg_div, structure_id, structure_name, color,value,activeRegion,showOutline,svgNode)
		{
            var	svgContainer = svgNode;
           
			var svgElement = getElementByAttribute('structure_id',structure_id,svgContainer);

			if (!(svgElement == null) ) {
			    svgElement.valueNum = value;
                // only bind the click event once.
                if (!$(svgElement).data('bound') ) {
					  $(svgElement).data('defaultStroke' ,svgElement.style.stroke);
                      $(svgElement).data('defaultStrokeWidth',svgElement.style.strokeWidth);

                      $(svgElement).data('bound',true);
                      $(svgElement).mouseenter(function() {
							  this.style.stroke = "#cf3";
                              this.style.strokeWidth = 20;
                              var this_id = this.getAttribute('structure_id');
                              $(svg_div).find('#structure_info').text( structure_name + '  (' + activeRegion + ' - ' + value + ') ');
                        }).mouseleave(function() {
							 if (showOutline) {
		                          this.style.stroke = $(this).data('defaultStroke');
		                          this.style.strokeWidth = $(this).data('defaultStrokeWidth');
							  }
                              $(svg_div).find('#structure_info').text('');
                        }).click( function() {
                          $( svg_div ).trigger( "areaClicked", [structure_id, structure_name] );
                        });
                }

				svgElement.style.fill = color; 
				if (!showOutline) 
				{ 
					svgElement.style.stroke = "#f2f1f0";
					svgElement.style.strokeWidth = 0;
				}
			}
		}

		function getStructureColor(svg_div, data,colorDict,valuesDict, default_color, svgNode)
		{// this function iterates over the regions in the data. For each region it checks if it has a value if not it takes the value from its parent

			var currentStructID,currentStructName,parentStructID,currentValue,parentValue,parentColor;
			currentStructID = data[0]['id'];
			currentStructName = data[0]['name'];
			colorDict[currentStructID] = default_color;
			var showOutline = true;

			var activeRegions = {};
			activeRegions[currentStructID] =  currentStructName;

            if (valuesDict) {// check if valuesDict exists
                for (var i=1; i< data.length; i++  ) 
                {
                    currentStructID = data[i]['id'];
                    parentStructID = data[i]['parent_structure_id'];
                    var currentStructName = data[i]['name'];
                    showOutline = true;
                    if ( !(currentStructID in colorDict) ){
                       parentColor = colorDict[parentStructID];
    //				   parentValue = valuesDict[parentStructID];
                       if (parentColor == null) {
                          colorDict[currentStructID] = default_color;
                          }
                       else {
                          parentValue = valuesDict[parentStructID];
                          colorDict[currentStructID] = parentColor;
                          valuesDict[currentStructID] = parentValue;
                          activeRegions[currentStructID] =  activeRegions[parentStructID];
                          if ( !(default_color == parentColor)) {showOutline = false;}
                          }
                       }
                    else { 
                        activeRegions[currentStructID] =  currentStructName;
                    }
                    setColor(svg_div, currentStructID, currentStructName, colorDict[currentStructID] ,valuesDict[currentStructID], activeRegions[currentStructID], showOutline, svgNode);
                }
            }
            else {
                  console.log('values dict does not exists');  
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
		
		function redirectToPage(dictionary) {
            var newUrl = "?";
            for (var key in dictionary) {
                newUrl += key + "=" + dictionary[key] + "&";
            } 

            newUrl = newUrl.substring(0, newUrl.length - 1);
			window.location.href = newUrl ;
		}

		function encode_as_img_and_link(current_object){
            var settings = $(current_object).data('settings');
			var atlasName = settings.ontology;
			var location = settings.location;

			 var svg = $(current_object).find('#svgDrawing').attr({ version: '1.1' , xmlns:"http://www.w3.org/2000/svg"}).html();
			 var b64 = Base64.encode(svg); // or use btoa if supported

			 // Works in Firefox 3.6 and Webit and possibly any browser which supports the data-uri
            $(current_object).find('#image_download').attr('href', 'data:image/svg+xml;base64,\n' +b64).attr('download',  atlasName + "-" + location + ".svg");
//			 $(current_object).find("#buttonsAndStuff").append($("<a href-lang='image/svg+xml' href='data:image/svg+xml;base64,\n"+b64+"' title='file.svg' download='" + atlasName + "-" + location + ".svg'>Download</a>"));
		}

        function createColorBar(colorbar_div, properties) {
            $(colorbar_div).colorbar(properties.width, properties.height, properties.colormap, $(this).data('regionData').minValue, $(this).data('regionData').maxValue); 
        }


        function redirectToPage2(dictionary) {
            /* This function replace the element in the url 
               with elements and values which are provided
               by the dictionay.
            */
            var url = window.location.href;
            
            for (var key in dictionary) {
                url = UpdateQueryString(key, dictionary[key], url);
            } 

			window.location.href = url ;
		}

        function UpdateQueryString(key, value, url) {
            if (!url) url = window.location.href;
            var re = new RegExp("([?&])" + key + "=.*?(&|#|$)(.*)", "gi");

            if (re.test(url)) {
                if (typeof value !== 'undefined' && value !== null)
                    return url.replace(re, '$1' + key + "=" + value + '$2$3');
                else {
                    var hash = url.split('#');
                    url = hash[0].replace(re, '$1$3').replace(/(&|\?)$/, '');
                    if (typeof hash[1] !== 'undefined' && hash[1] !== null) 
                        url += '#' + hash[1];
                    return url;
                }
            }
            else {
                if (typeof value !== 'undefined' && value !== null) {
                    var separator = url.indexOf('?') !== -1 ? '&' : '?',
                        hash = url.split('#');
                    url = hash[0] + separator + key + '=' + value;
                    if (typeof hash[1] !== 'undefined' && hash[1] !== null) 
                        url += '#' + hash[1];
                    return url;
                }
                else
                    return url;
            }
        }
	
