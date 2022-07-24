const years = ['1990', '1991', '1992', '1993', '1994', '1995', '1996', '1997', '1998', '1999', '2000', '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019'];

async function lineChart(country) {
	const rightAxisXPos = width + margin;
		
	const axisKeys = {x:{col: "black", indicator: "Year"}, y:[{col: "steelblue", indicator: "Total CO2 emission (kt)"}, {col: "red", indicator: "Per capita CO2 emission"}]}
	
	var lineSvg = d3.select("#line-chart-wrapper")
	.append("svg")
    .attr("width", outerwidth)
    .attr("height", outerheight)
	.attr("id", "lineChart");
	
	// Set name of country in the chart description.
	d3.select("#chart-summary #chart-title").text(`Total and per capita CO2 emission for ${country} over the years.`)
	d3.select("#chart-summary p").text("This visualization displays total and per capita CO2 emission for a country over the years. This chart utilizes dual scales on y-axis because both of these indicators have different range of values. Left axis indicate TotalCO2 emission and right axis indicates Per capits CO2 emission.")
	
	let data = fulldata.filter(o => o.Country == country)
	
	const maxCO2 =  Math.max(...data.map(a => a.TotalCO2));
	const maxPerCapitaCO2 =  Math.max(...data.map(a => a.PerCapitaCo2));
	
	// Common methods to format axis.
	formatXAxis = (a) => { return a.tickValues(years).tickFormat(d3.format("d")); }
	formatYAxis = (a) => { return a.tickFormat(d3.format("~s")); }

	// Horizontal axis - Year
	const xscale = d3.scaleLinear().domain([1990, 2019]).range([0, width]); 
	xaxis = g => g
		.call(formatXAxis(d3.axisBottom(xscale)))
		.call(g => g.append("text")
			.attr("x", width / 2)
			.attr("y", margin - 10)
			.attr("fill", axisKeys.x.col)
			.attr("class", "chart-axis")
			.text(axisKeys.x.indicator))
			
	// verticle axis - CO2 per capita 
	const yscale = d3.scaleLinear().domain([0, maxCO2 + 1000]).range([height, 0]); 
	yaxis = g => g
		.call(formatYAxis(d3.axisLeft(yscale)))
		.call(g => g.append("text")
			.attr("x", height/ 2)
			.attr("y", margin - 3)
			.attr("fill", axisKeys.y[0].col)
			.attr("class", "chart-axis")
			.text(axisKeys.y[0].indicator)
			.attr("transform", "rotate(90)"));

	// verticle axis - Total CO2
	const yscale1 = d3.scaleLinear().domain([0, maxPerCapitaCO2 + 1]).range([height, 0]); 
	yaxis1 = g => g
		.call(formatYAxis(d3.axisRight(yscale1)))
		.call(g => g.append("text")
			.attr("x", height/ 2 - 140)
			.attr("y", -(margin / 2) - 5)
			.attr("fill", axisKeys.y[1].col)
			.attr("class", "chart-axis")
			.text(axisKeys.y[1].indicator)
			.attr("transform", "rotate(90)"));

	// Tooltip - idprefix is kept null to avoid any regression.
	createLineChartToolTip(lineSvg, data, xscale, yscale, 6, '', years)
	
	// Grid
	grid = g => createLineChartGrid(g, xscale, yscale)
	
	// Create legend.
	lineChartLegend(outerheight, axisKeys);
	
	// Create annotationData
	const annotationInfo = [{y:2009, l:'Economic recession'}];
	const annotationData = lineChartAnnotation(data, annotationInfo, Co2Indicator.Total, xscale, margin, yscale, width, height);
	const makeAnnotations = d3.annotation().annotations(annotationData)
	
	// Left line chart
	lineSvg.append("g") 
		.attr("transform", "translate("+margin+","+margin+")") 
		.append("path").datum(data)
		.style("fill", "none")
		.attr("stroke-width", 1.5)
		.attr("stroke", "steelblue")
		.attr("d", d3.line()
						.x(function(d) { return xscale(d.Year) })
						.y(function(d) { return yscale(d.TotalCO2) })
			);
	
	// Right line chart
	lineSvg.append("g") 
		.attr("transform", "translate("+margin+","+margin+")") 
		.append("path").datum(data)
		.style("fill", "none")
		.attr("stroke-width", 1.5)
		.attr("stroke", "red")
		.attr("d", d3.line()
						.x(function(d) { return xscale(d.Year) })
						.y(function(d) { return yscale1(d.PerCapitaCo2) })
			);
	
	lineSvg.append("g") 
		.attr("transform", "translate("+margin+","+margin+")") 
		.selectAll("circle").data(data).enter().append("circle")
		.call(g => g.attr("cx", function(d, i) {return xscale(d.Year)}) 
					.attr("cy", function(d, i) {return yscale1(d.PerCapitaCo2)})
					.attr("r", "4"))
		.append("title")
		.text(function(d) {return TooltipText(d)});

	// Add points on lines.
	lineSvg.append("g") 
		.attr("transform", "translate("+margin+","+margin+")") 
		.selectAll("circle").data(data).enter().append("circle")
		.call(g => g.attr("cx", function(d, i) {return xscale(d.Year)}) 
					.attr("cy", function(d, i) {return yscale(d.TotalCO2)})
					.attr("r", "4"))
		.append("title")
		.text(function(d) {return TooltipText(d)});
	
	// Add styling and events to the points.
	lineSvg.selectAll("circle")
		.call(g => g.style("stroke", "steelblue")
					.attr("fill-opacity", .2))
		.on('mouseover',function() {
			d3.select(this)
			.attr('stroke-width',4)})
		.on('mouseout',function () {
			d3.select(this)
			.transition()
			.duration(1000)
			.attr('stroke-width',1)});
	
	// add axis
	lineSvg.append("g") 
		.attr("transform", "translate("+margin+","+margin+")") 
		.call(yaxis) 	

	lineSvg.append("g") 
		.attr("transform", "translate( " +rightAxisXPos+ ", "+margin+" )") 
		.call(yaxis1) 

	lineSvg.append("g") 
		.attr("transform", "translate("+margin+","+(height+margin)+")")
		.call(xaxis) 
		
	lineSvg.append("g") 
		.call(grid)
		
	lineSvg
		.append("g")
		.call(makeAnnotations);
}

// Method - Create bubble chart annotations.
var lineChartAnnotation = function(data, annotationInfo, indicator, xscale, margin, yscale, chartWidth, chartHeight){
	let annotationData = []
	
	for (const ann of annotationInfo) {
		const xofctry = xscale(ann.y) + margin;
		const dataOfYear = data.find(o => o.Year == ann.y);
		const yofctry = yscale( indicator == Co2Indicator.Total ? dataOfYear.TotalCO2 : dataOfYear.PerCapitaCo2) + margin;
		const dx = xofctry + 100 > chartWidth ? -40 : 40; // Ensure that annotations are not going outside chart dimensions.
		const dy = yofctry + 240 > chartHeight ? -40 : 40;
		var a = {
			note: {
				label: ann.l,
				title: ann.y,
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
		
	return annotationData;
}

// Method - Genereate line chart legends
var lineChartLegend = function(outerheight, axisKeys) {
	var marginLengend = 5
	var legendW = 200
	var legendH = outerheight
	
	var legendSvg = d3.select("#lineChart-legend")
		.append("svg")
		.attr("transform", "translate("+marginLengend+","+marginLengend+")")
		.attr("width", legendW)
		.attr("height", legendH)
		.attr("id", "lineChartlegend");
	
	legendSvg.selectAll("rect")
	  .data(axisKeys.y)
	  .enter()
	  .append("rect")
		.attr("x", 10)
		.attr("y", function(d,i){ return 107 + i*25})
		.attr("width", 10)
		.attr("height", 10)
		.style("fill", function(d){ return d.col})

	legendSvg.selectAll("mylabels")
	  .data(axisKeys.y)
	  .enter()
	  .append("text")
		.attr("x", 30)
		.attr("y", function(d,i){ return 117 + i*25})
		.style("fill", function(d){ return d.col})
		.text(function(d){ return d.indicator});
}

// Method - Create line chart grid.
const createLineChartGrid = function(g, xscale, yscale) {
	g.attr("stroke", "currentColor")
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
}

const createLineChartToolTip = function(lineSvg, data, xscale, yscale, itemCount, idPrefix, years) {
	var focus = lineSvg.append("g")
		.attr("class", "focus")
		.style("display", "none");

	focus.append("circle")
		.attr("transform", "translate("+margin+","+margin+")") 
		.attr("r", 8);

	focus.append("rect")
		.attr("transform", "translate("+margin+","+margin+")") 
		.attr("class", "tooltip")
		.attr("width", 300).attr("height", 100)
		.attr("x", 10).attr("y", 10);

	for (let i = 0; i < itemCount; i++) {
		focus.append("text")
			.attr("transform", "translate("+margin+","+margin+")") 
			.attr("id", `${idPrefix}linetooltip${i}`)
			.attr("x", 18).attr("y", 27 + i * 15);
	}
		
	lineSvg.append("rect")
		.attr("class", "overlay")
		.attr("width", outerwidth)
		.attr("height", outerheight)
		.on("mouseover", function() { focus.style("display", null); })
		.on("mouseout", function() { focus.style("display", "none"); })
		.on("mousemove", mousemove);
		
	function mousemove() {
		const i = d3.bisectCenter(years, xscale.invert(d3.pointer(event)[0])) - 1;
		const yearData = data.filter(o => o.Year == years[i])[0];
		const yvalue = yearData.TotalCO2;
		const xvalue = yearData.Year;
		// console.log(`${i} - ${xvalue}`);
		
		const rectx = xvalue <= 2008 ? 10 : -310;
		const textx = xvalue <= 2008 ? 18 : -300;
		focus.select(".tooltip").attr("x", rectx);
		focus.attr("transform", "translate("+xscale(xvalue)+", "+yscale(yvalue)+")");
		
		const tipTxtArr = toolTipTextArray(yearData);
		for (let i = 0; i < 6; i++) {
			focus.select(`#${idPrefix}linetooltip${i}`).attr("x", textx);
			focus.select(`#${idPrefix}linetooltip${i}`).html(tipTxtArr[i]);
		}
	}
}