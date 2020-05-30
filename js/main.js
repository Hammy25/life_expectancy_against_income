$(document).ready( function () { 
	d3.json("data/data.json").then(function(data){

	var data = data.map((item) => {
		item.countries = item.countries.filter( country => (country.income !== null));
		item.countries = item.countries.filter( country => (country.life_exp !== null));
		return item;
	})

	var interval;

	var incomes = [];

	var life_e = [];

	var populations = [];

	var continents = [];


	for(let index=0 ; index <= data.length - 1; index++){
		var lengthCountries = data[index].countries.length;
		for(let i = 0; i <= lengthCountries - 1; i++){
			incomes.push(data[index].countries[i].income);
			life_e.push(data[index].countries[i].life_exp);
			populations.push(data[index].countries[i].population);
			if(continents.indexOf(data[index].countries[i].continent) == -1){
				continents.push(data[index].countries[i].continent);
			}
		}
	}
	const svgHeight = 500;
	const svgWidth = 1180;

	const margin = {top: 10, right: 10, bottom: 50, left: 50}

	var tooltip = d3.select("body")
					.append("div")
					.attr("id", "tooltip")
					.attr("style", "visibility: hidden");

	var canvas = d3.select("#chart-area").append("svg")
										 .attr("id", "svgarea")
										 .attr("height", svgHeight)
										 .attr("width", svgWidth);

	var chart = canvas.append("g")
					  .attr("id", "plot")
					  .attr("transform", "translate("+ margin.left + ", " + margin.top + ")");


	var xAxisText = chart.append("text")
						 .attr("class", "x axis-label")
						 .attr("x", (svgWidth - margin.left - margin.right) / 2)
						 .attr("y", svgHeight - (margin.bottom/4))
						 .attr("text-anchor", "middle")
						 .text("GDP per capita");

	var yAxisText = chart.append("text")
						 .attr("transform", "rotate(-90)")
				         .attr("y", 0 - margin.left)
				         .attr("x",0 - ((svgHeight-margin.top-margin.bottom) / 2))
				         .attr("dy", "1em")
				         .style("text-anchor", "middle")
				         .text("Life Expectancy (yrs)");

    var yearText = chart.append("text")
				         .attr("y",  (svgHeight - margin.bottom - 30))
				         .attr("x", (svgWidth-margin.left-margin.right-50))
				         .attr("font-size", 24)
				         .attr("font-weight", "bold")
				         .attr("fill-opacity", 0.5)
				         .attr("dy", "1em")
				         .style("text-anchor", "left")

	var xScale = d3.scaleLog()
				   .domain([(d3.min(incomes)), (d3.max(incomes) + 10000)])
				   .range([margin.left, (svgWidth - margin.right)])
				   .base(10);

	var yScale = d3.scaleLinear()
				   .domain([0, d3.max(life_e)])
				   .range([(svgHeight - margin.bottom), margin.top]);

	var radiusScale = d3.scaleLinear()
						.domain([d3.min(populations), d3.max(populations)])
						.range([5, 50]);

	var continentColor = d3.scaleOrdinal()
						   .domain(continents)
						   .range(d3.schemeCategory10);

	var xAxis = d3.axisBottom(xScale).tickValues([400, 4000, 40000])
								     .tickFormat(d => {
								   	return("$ " + d);
								   });;

	var yAxis = d3.axisLeft(yScale);

	var xAxisGroup = chart.append("g")
						  .attr("class", "x axis")
						  .attr("transform", "translate(0, " + (svgHeight - margin.bottom) + ")" );

	var yAxisGroup = chart.append("g")
						  .attr("class", "y axis")
						  .attr("transform", "translate(" + margin.left + ",0)");

	var legend = chart.append("g")
					  .attr("transform", "translate("+ (svgWidth - margin.left - 50) + "," + (svgHeight - margin.bottom - 125) + ")" )

	continents.forEach((continent, i) => {

		var legendRow = legend.append("g")
							  .attr("transform", "translate(0, " + (i*20) + ")")

			legendRow.append("rect")
					 .attr("width", 10)
					 .attr("height", 10)
					 .attr("fill", continentColor(continent))
					 .attr("stroke", "black")
					 .attr("fill-opacity", 0.6);

		    legendRow.append("text")
		    		 .attr("x", -10)
		    		 .attr("y", 10)
		    		 .attr("text-anchor", "end")
		    		 .style("text-transform", "capitalize")
		    		 .text(continent);
	});

	var index = 0;

	function updateGraph(){
	    if(index <= data.length - 1){
				update(data[index])	
			}
			index = index + 1;
	}

	$("#play").click( () =>{
		$("#play").prop("disabled", true)
		interval = setInterval(updateGraph, 500);
	})

	$("#pause").click( () => {
		clearInterval(interval);
		$("#play").prop("disabled", false)
	})
 
    $("#year-range").change( () => {
    	clearInterval(interval);
    	$("#range-value").text($("#year-range").val());
    	var selectedYear = $("#year-range").val();
    	var selectedYearData = data.filter(item => item.year == parseInt(selectedYear, 10));
    	update(selectedYearData[0]);
    	$("#play").prop("disabled", false);
    	index = data.indexOf(selectedYearData[0]);
    });

    $("#continent-select").change( () => {
    	clearInterval(interval);
    	(index <= data.length - 1)? update(data[index]) : update(data[data.length - 1]);
    	update(data[index]);
    	$("#play").prop("disabled", false);
    });

	update(data[index]);


	function update(data){

		xAxisGroup.call(xAxis);
		yAxisGroup.call(yAxis);

		yearText.text(data.year);

		if($("#continent-select").val() != "all"){
			var circles = chart.selectAll("circle").data(data.countries.filter(item => item.continent === $("#continent-select").val()));
		}else{
			var circles = chart.selectAll("circle").data(data.countries);
		}


		circles.exit().remove();

		circles.enter()
				.append("circle")
				.attr("cx", 0)
				.attr("cy", 0)
				.attr("r", 0)
				.attr("fill-opacity", 0)
				.on("mouseover", (d, i) => {
					var continent = d.continent; 
                    continent = continent[0].toUpperCase() + continent.slice(1); 
					d3.select("#tooltip").html(
						"Continent: " + continent + "<br>"
						+"Country: " + d.country + "<br>"
						+"Population: " + d.population + "<br>"
						+"Life Expectancy: " + d.life_exp + "<br>"
						+ "GDP per Capita: " + "$" + d.income
						)
							.style("left", (d3.event.pageX + 20)+ "px")
							.style("top", (d3.event.pageY) + "px")
				     		.style("visibility", "visible")
				})
				.on("mouseout", () => {
					tooltip.style("visibility", "hidden")
				})
				.merge(circles)
				.transition()
				.duration(450)
				.attr("data-income", d => d.income)
				.attr("data-life", d => d.life_exp)
				.attr("data-country", d => d.country)
				.attr("data-content", d => d.continent)
				.attr("data-population", d => d.population)
				.attr("cx", d => xScale(d.income))
				.attr("cy", d => yScale(d.life_exp))
				.attr("r", d => radiusScale(d.population))
				.attr("fill", d => continentColor(d.continent))
				.attr("fill-opacity", 0.6);

	}

	}).catch( (error) => {
		console.log("The following error occured => " + error);
	});

});