// Enum for bubble chart types.
const BubbleChartButtonStatus = {
	PerCapita: 0,
	Total: 1
}

async function bubbleChart(year) {
	const fulldata = await d3.csv("YearCountryWiseIndicators.csv");
	const margin = 50; 
	
	const outerwidth = 1400 * 0.88; 
	const outerheight = 700; 
	
	const width = outerwidth - 2 * margin; 
	const height = outerheight - 2 * margin; 
	
	d3.select('#bubble-chart-controls').style("display", "block")
	
	// Set name of country in the chart description.
	d3.select("#chart-summary #chart-title").text("Weath, population and per capita CO2 emission of nations.")
	document.getElementById("chart-desc").innerHTML = "This visualization shows GDP(<em>x</em>), per capita CO2 emission (<em>y</em>) and population (<em>area</em>) of nations between 1990 and 2019, colored by income group. There was no data available for CO2 emission before 1990 on <a href=\"https://data.worldbank.org/topic/climate-change\">The World Bank website</a> therefore this visualization shows data for years 1990-2019."
	
	let data = fulldata.filter(o => o.Year == year)
	const maxPcCO2 =  Math.max(...data.map(a => a.PerCapitaCo2));
	
	// Common method to format axis.
	formatXAxis = (a) => { return a.tickValues([100, 1000, 5000, 10000, 20000]).tickFormat(d3.format("~s")); }
	
	formatYAxis = (a) => { return bubbleChartButtonStatus == BubbleChartButtonStatus.PerCapita ? a.tickFormat(d3.format("~s")) : a.tickValues([100, 1000, 10000, 100000, 1000000, 10000000, 500000000]).tickFormat(d3.format("~s")); }

	// Horizontal axis - GDP
	const xscale = d3.scaleLog().domain([1, 22500]).range([0, width]); 
	xaxis = g => g
		.call(formatXAxis(d3.axisBottom(xscale)))
		.call(g => g.append("text")
			.attr("x", width)
			.attr("y", margin - 10)
			.attr("fill", "currentColor")
			.attr("text-anchor", "end")
			.text("GDP (Billion dollars) - Log scale"))
			
	// verticle axis - CO2 per capita 
	var yaxisText = bubbleChartButtonStatus == BubbleChartButtonStatus.PerCapita ? "CO2 emission per capita (metric tons)" : "Total CO2 emission (kt) - Log Scale";
	
	var ydomain = bubbleChartButtonStatus == BubbleChartButtonStatus.PerCapita ? [0, 45] : [50, Math.max(...data.map(a => a.TotalCO2)) + 20000000];
	let yscale = bubbleChartButtonStatus == BubbleChartButtonStatus.PerCapita ? d3.scaleLinear() : d3.scaleLog(); 
	yscale = yscale.domain(ydomain).range([height, 0]);
	
	yaxis = g => g
		.call(formatYAxis(d3.axisLeft(yscale)))
		.call(g => g.append("text")
			.attr("x", 10)
			.attr("y", margin - 10)
			.attr("fill", "currentColor")
			.attr("text-anchor", "start")
			.text(yaxisText)
			.attr("transform", "rotate(90)"))

	// Color scale by Income group.
	const colorKeys = ['Low income','Upper middle income', 'Lower middle income', 'High income']
    colors = d3.scaleOrdinal()
       .domain(colorKeys)
	   .range(d3.schemeSet2);

	// Circle size by population.
	population2radius = d3.scaleSqrt()
	  .domain([0, 2e9])
	  .range([0, 60])

	// Grid
	grid = g => g
		.attr("stroke", "currentColor")
		.attr("stroke-opacity", 0.1)
		.call(g => g.append("g")
		  .selectAll("line")
		  .data(xscale.ticks())
		  .join("line")
			.attr("x1", d => margin + xscale(d))
			.attr("x2", d => margin + xscale(d))
			.attr("y1", margin)
			.attr("y2", height + margin))
		.call(g => g.append("g")
		  .selectAll("line")
		  .data(yscale.ticks())
		  .join("line")
			.attr("y1", d => yscale(d) + margin)
			.attr("y2", d => yscale(d) + margin)
			.attr("x1", margin)
			.attr("x2", width + margin)); 
		
	// Create legend.
	bubbleChartLegend(outerheight, colorKeys, colors, population2radius);
	
	// Create annotations
	annotationData = bubbleChartAnnotation(data, xscale, margin, yscale, width, height)
	const makeAnnotations = d3.annotation().annotations(annotationData)
	
	var chartSvg = d3.select("#bubbleChart-wrapper")
		.append("svg")
		.attr("width", outerwidth)
		.attr("height", outerheight)
		.attr("id", "bubbleChart");
	
	chartSvg.append("g") 
		.attr("transform", "translate("+margin+","+margin+")") 
		.selectAll("circle").data(data).enter().append("circle")
		.call(g => g.attr("class", function(d,i) { return "Country"; })
					.attr("cx", function(d, i) {return xscale(d.GDPB)}) 
					.attr("cy", function(d, i) {return yscale(bubbleChartButtonStatus == BubbleChartButtonStatus.PerCapita ? d.PerCapitaCo2 : d.TotalCO2)}) 
					.style("fill", function(d){ return colors(d.IncomeGroup) })
					.attr("fill-opacity", .8)
					.attr("r", function(d, i) {return population2radius(parseInt(d.Population))} ))
		.on("click", function(event, d) {updateLineChart(d)} )
		.on('mouseover',function() {
			d3.select(this)
			.transition()
			.duration(500)
			.attr('stroke-width',2)
			.style("cursor", "pointer")})
		.on('mouseout',function () {
			d3.select(this)
			.transition()
			.duration(500)
			.attr('stroke-width',1)
			.style("cursor", "default"); })
		.append("title")
		.text(function(d) {return TooltipText(d)});
		
	chartSvg
		.append("g") 
		.attr("transform", "translate("+margin+","+margin+")") 
		.call(yaxis) 	

	chartSvg 
		.append("g") 
		.attr("transform", "translate("+margin+","+(height+margin)+")")
		.call(xaxis) 
		
	chartSvg 
		.append("g") 
		.call(grid)
		
	chartSvg
		.append("g")
		.call(makeAnnotations);
}

// Method - Create bubble chart annotations.
var bubbleChartAnnotation = function(data, xscale, margin, yscale, chartWidth, chartHeight){
	const countrySortedByEmission = bubbleChartButtonStatus == BubbleChartButtonStatus.PerCapita ? 
																	data.sort((a,b) => b.PerCapitaCo2 - a.PerCapitaCo2).map(a => a.Country) : 
																	data.sort((a,b) => b.TotalCO2 - a.TotalCO2).map(a => a.Country);;
	
	const annotationY = function(country) {
		return bubbleChartButtonStatus == BubbleChartButtonStatus.PerCapita ? 
											data.find(o => o.Country == country.c).PerCapitaCo2 : 
											data.find(o => o.Country == country.c).TotalCO2;
	}
	
	let annotationData = []
	
	var generateAnnotation = function(countries){
		for (const country of countries) {
			const xofctry = xscale(data.find(o => o.Country == country.c).GDPB) + margin;
			const yofctry = yscale(annotationY(country)) + margin;
			const dx = xofctry + 100 > chartWidth ? -40 : 40; // Ensure that annotations are not going outside chart dimensions.
			const dy = yofctry + 240 > chartHeight ? -40 : 40;
			var a = {
				note: {
					label: country.l,
					title: country.c,
					wrap: 200,
					padding: 10
				},
				color: ["#cc0000"],
				x: xofctry,
				y: yofctry,
				dy: dy,
				dx: dx
			}
			annotationData.push(a);
		}
	}
	
	generateAnnotation([{c:countrySortedByEmission[0], l:'#1 capita carbon emission.'},
		{c:countrySortedByEmission[1], l:'#2'},
		{c:countrySortedByEmission[2], l:'#3'},
		{c:countrySortedByEmission[3], l:'#4'},
		{c:countrySortedByEmission[4], l:'#5'},
		{c:'United States', l: `#${countrySortedByEmission.indexOf("United States") + 1}`},
		{c:'India', l:`#${countrySortedByEmission.indexOf("India") + 1} Very high population but less per capita carbon emission`},
		{c:'Canada', l:`#${countrySortedByEmission.indexOf("Canada") + 1}`},
		{c:'China', l:`#${countrySortedByEmission.indexOf("China") + 1}`},
		{c:'Ethiopia', l:`#${countrySortedByEmission.indexOf("Ethiopia") + 1}`}])
		
	return annotationData;
}

// Method - Genereate bubble chart legends
var bubbleChartLegend = function(outerheight, colorKeys, colors, population2radius) {
	var marginLengend = 5
	var legendW = 200
	var legendH = outerheight
	var legendSvg = d3.select("#bubbleChart-legend")
		.append("svg")
		.attr("transform", "translate("+marginLengend+","+marginLengend+")")
		.attr("width", legendW)
		.attr("height", legendH)
		.attr("id", "bubbleChartlegend");
	
	legendSvg.selectAll("mydots")
	  .data(colorKeys)
	  .enter()
	  .append("circle")
		.attr("cx", 10) // 1150
		.attr("cy", function(d,i){ return 60 + i*25})
		.attr("r", 7)
		.style("fill", function(d){ return colors(d)})

	legendSvg.selectAll("mylabels")
	  .data(colorKeys)
	  .enter()
	  .append("text")
		.attr("x", 30)
		.attr("y", function(d,i){ return 60 + i*25})
		.style("fill", function(d){ return colors(d)})
		.text(function(d){ return d})
		.attr("text-anchor", "left")
		.style("alignment-baseline", "middle")
	// ****** End - Income Group legend. ****
	
	
	// ****** Start - Population legend. ****
	var valuesToShow = [10000000, 100000000, 1000000000]
    var xCircle = 50
    var xLabel = 100
    legendSvg.selectAll("legend")
      .data(valuesToShow)
      .enter()
      .append("circle")
        .attr("cx", xCircle)
        .attr("cy", function(d){ return legendH - 450 - population2radius(d) } )
        .attr("r", function(d){ return population2radius(d) })
        .style("fill", "none")
        .attr("stroke", "black")
	
	// Add legend: segments
    legendSvg.selectAll("legend")
      .data(valuesToShow)
      .enter()
      .append("line")
        .attr('x1', function(d){ return xCircle + population2radius(d) } )
        .attr('x2', xLabel)
        .attr('y1', function(d){ return legendH - 450 - population2radius(d) } )
        .attr('y2', function(d){ return legendH - 450 - population2radius(d) } )
        .attr('stroke', 'black')
        .style('stroke-dasharray', ('2,2'))
	
	 legendSvg.selectAll("legend")
      .data(valuesToShow)
      .enter()
      .append("text")
        .attr('x', xLabel)
        .attr('y', function(d){ return legendH - 450 - population2radius(d) } )
        .text( function(d){ return d/1000000 } )
        .style("font-size", 10)
        .attr('alignment-baseline', 'middle')
	
	 legendSvg.append("text")
      .attr('x', xCircle)
      .attr("y", legendH - 450 + 30)
      .text("Population (M)")
      .attr("text-anchor", "middle")
}