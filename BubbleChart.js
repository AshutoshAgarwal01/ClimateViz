// Enum for bubble chart types.
const BubbleChartButtonStatus = {
	PerCapita: 0,
	Total: 1
}

// Remove bubble chart.
async function removeBubbleChart() {
	d3.select('#bubbleChart').remove()
}

removeBubbleChartLegend = function() {
	d3.select('#bubbleChartlegend').remove()
}

async function bubbleChart(year) {
	showBubbleChartControls();
	
	// Set name of country in the chart description.
	d3.select("#chart-summary #chart-title").text("Wealthy are top polluters.")
	
	const indicator = bubbleChartButtonStatus == BubbleChartButtonStatus.PerCapita ? "Per capita CO2 emission" : "Total CO2 emission";
	document.getElementById("chart-desc").innerHTML = `Notice that developing country (e.g. Japan) emits far more CO2 per year then other developing nation (e.g., Ethiopia). <br/><br/>This visualization shows GDP(<em>x</em>), ${indicator} (<em>y</em>) and population (<em>area</em>) of nations between 1990 and 2019, colored by income group.`
	
	// let data = fulldata.filter(o => o.Year == year)
	
	const selectedIncomeGroups = getSelectedIncomeGroups();
	let data = fulldata.filter(o => o.Year == year && selectedIncomeGroups.includes(o.IncomeGroup));
	
	// Common method to format axis.
	formatXAxis = (a) => { return a.tickValues([100, 1000, 5000, 10000, 20000]).tickFormat(d3.format("~s")); }
	
	formatYAxis = (a) => { return bubbleChartButtonStatus == BubbleChartButtonStatus.PerCapita ? a.tickFormat(d3.format("~s")) : a.tickValues([100, 1000, 10000, 100000, 1000000, 10000000, 500000000]).tickFormat(d3.format("~s")); }

	// max values for axis
	// We are getting max for each indicator regardless of time so that chart remains stable when income group is toggled.
	const dataForAxisRange = fulldata.filter(o => selectedIncomeGroups.includes(o.IncomeGroup));
	const maxGdpb = Math.max(...dataForAxisRange.map(a => a.GDPB));
	let maxPcCO2 =  Math.max(...dataForAxisRange.map(a => a.PerCapitaCo2));
	maxPcCO2 = maxPcCO2 > 45 ? 45 : maxPcCO2;
	const maxTotalCO2 =  Math.max(...dataForAxisRange.map(a => a.TotalCO2));

	// Horizontal axis - GDP
	const xscale = d3.scaleLog().domain([1, maxGdpb + 100]).range([0, width]); 
	xaxis = g => g
		.call(formatXAxis(d3.axisBottom(xscale)))
		.call(g => g.append("text")
			.attr("x", width / 2)
			.attr("y", margin - 10)
			.attr("fill", "currentColor")
			.attr("class", "chart-axis")
			.text("GDP (Billion dollars) - Log scale"))
			
	// verticle axis - CO2 per capita 
	var yaxisText = bubbleChartButtonStatus == BubbleChartButtonStatus.PerCapita ? "CO2 emission per capita (metric tons)" : "Total CO2 emission (kt) - Log Scale";
	
	var ydomain = bubbleChartButtonStatus == BubbleChartButtonStatus.PerCapita ? [0, maxPcCO2 + 0.1] : [50, maxTotalCO2 + 20000000];
	let yscale = bubbleChartButtonStatus == BubbleChartButtonStatus.PerCapita ? d3.scaleLinear() : d3.scaleLog(); 
	yscale = yscale.domain(ydomain).range([height, 0]);
	
	yaxis = g => g
		.call(formatYAxis(d3.axisLeft(yscale)))
		.call(g => g.append("text")
			.attr("x", height / 2)
			.attr("y", margin - 10)
			.attr("fill", "currentColor")
			.attr("class", "chart-axis")
			.text(yaxisText)
			.attr("transform", "rotate(90)"))

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
		.on("click", function(event, d) {updateDrillDownLineChart(d)} )
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
	
	const annotationY = function(country, data) {
		return bubbleChartButtonStatus == BubbleChartButtonStatus.PerCapita ? 
											data.find(o => o.Country == country.c).PerCapitaCo2 : 
											data.find(o => o.Country == country.c).TotalCO2;
	}
	
	let annotationData = []
	
	var generateAnnotation = function(countries, data){
		const selectedIncomeGroups = getSelectedIncomeGroups();
		for (const country of countries) {
			const conuntryData = data.find(o => o.Country == country.c);
			if (conuntryData && selectedIncomeGroups.includes(conuntryData.IncomeGroup)) {
				const xofctry = xscale(data.find(o => o.Country == country.c).GDPB) + margin;
				const yofctry = yscale(annotationY(country, data)) + margin;
				
				var distx = disty = -40
				
				// Hack to fix overlapping annotations in total emission bubble chart.
				if (bubbleChartButtonStatus == BubbleChartButtonStatus.Total) {
					if (country.c == "Japan" || country.c == "Ethiopia") {
						distx = disty = 40
					}
					else if(country.c == "United States") {
						disty = 40
					}
				}
				
				const dx = distx; // Ensure that annotations are not going outside chart dimensions.
				const dy = disty;
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
	}
	
	generateAnnotation([{c:countrySortedByEmission[0], l:'#1 capita carbon emission.'},
			{c:countrySortedByEmission[1], l:'#2'},
			{c:countrySortedByEmission[2], l:'#3'},
			{c:countrySortedByEmission[3], l:'#4'},
			{c:countrySortedByEmission[4], l:'#5'},
			// {c:'United States', l: `#${countrySortedByEmission.indexOf("United States") + 1}`},
			// {c:'India', l:`#${countrySortedByEmission.indexOf("India") + 1}`},
			// {c:'Canada', l:`#${countrySortedByEmission.indexOf("Canada") + 1}`},
			// {c:'China', l:`#${countrySortedByEmission.indexOf("China") + 1}`},
			{c:'Ethiopia', l:`#${countrySortedByEmission.indexOf("Ethiopia") + 1}`}
		], data)
		
	return annotationData;
}

var incomeLegendClickHandler = async function(event, selectedIncomeGroup) {
	const id = event.target.id;
	const labelId = id.replace("btn-", "lbl-");
	const isSelected = d3.selectAll(`#${id}`).attr("selected");
	
	// toggle fill.
	const newSelected = isSelected === 'true' ? false : true;
	var newfill = newSelected == true ? d3.selectAll(`#${labelId}`).style("fill") : "white";
	d3.selectAll(`#${id}`).style("fill", newfill);
	d3.selectAll(`#${id}`).attr("selected", newSelected);

	await updateMainCanvas(getTimeSliderValue());
}

// Method - Genereate bubble chart legends
var createBubbleChartLegend = function(outerheight, incomeGroups, colors, population2radius) {
	var marginLengend = 5
	var legendW = 200
	var legendH = outerheight
	var legendSvg = d3.select("#bubbleChart-legend")
		.append("svg")
		.attr("transform", "translate("+marginLengend+","+marginLengend+")")
		.attr("width", legendW)
		.attr("height", legendH)
		.attr("id", "bubbleChartlegend");
	
	const legendOuterCircleRadius = 7;
	const radioMouseOverEventHandler = function(id) {
		d3.select(`#${id}`)
			.transition()
			.duration(500)
			.attr('stroke-width',2);
	}

	const radioMouseOutEventHandler = function(id) {
		d3.select(`#${id}`)
			.transition()
			.duration(500)
			.attr('stroke-width',1);
	}
	
	legendSvg.selectAll("incomeGroupLegendCircle")
	  .data(incomeGroups)
	  .enter()
	  .append("circle")
		.attr("cx", 10)
		.attr("cy", function(d,i){ return 57 + i*25})
		.attr("r", legendOuterCircleRadius)
		.attr("id", function(d) { return `btno-${d.id}`} )
		.style("fill", "white")
		.on('mouseover',function() { radioMouseOverEventHandler(this.id) })
		.on('mouseout',function () { radioMouseOutEventHandler(this.id) });
			
	legendSvg.selectAll("innerIncomeGroupLegendCircle")
	  .data(incomeGroups)
	  .enter()
	  .append("circle")
		.attr("cx", 10)
		.attr("cy", function(d,i){ return 57 + i*25})
		.attr("r", legendOuterCircleRadius - 2)
		.attr("id", function(d) { return `btn-${d.id}`} )
		.attr('stroke-width',0)
		.attr("selected", true )
		.style("fill", function(d){ return colors(d.name)})
		.on("click", function(event, d) { incomeLegendClickHandler(event, d); } )
		.on('mouseover',function() { radioMouseOverEventHandler(this.id.replace("btn-", "btno-")) })
		.on('mouseout',function () { radioMouseOutEventHandler(this.id.replace("btn-", "btno-")) });
			
	legendSvg.selectAll("incomeGroupLegendLabel")
	  .data(incomeGroups)
	  .enter()
	  .append("text")
		.attr("id", function(d) { return `lbl-${d.id}`} )
		.attr("x", 30)
		.attr("y", function(d,i){ return 60 + i*25})
		.style("fill", function(d){ return colors(d.name)})
		.text(function(d){ return d.name});
		
	legendSvg.append("text")
      .attr('x', 10)
      .attr("y", 57 - 25 )
      .text("Income Group")
	  .style("fill", "black");
      // .attr("text-anchor", "middle");
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