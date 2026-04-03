console.log("script loaded");

const inputForm = document.getElementById("input-form");
const searchInput = document.getElementById("search-input");
const status = document.getElementById("status");
const movieList = document.getElementById("movie-list");
const apiKey = "YOUR_API_KEY";
const apiUrl = "https://www.omdbapi.com/";
let currentMovies = [];
let currentSort = "";
const sortSelect = document.getElementById("sort-filter");
let currentQuery ="";
let currentPage = 1;
let totalResults = 0;
const RESULTS_PER_PAGE = 10;

inputForm.addEventListener("submit", event => {
    event.preventDefault();

    const query = searchInput.value.trim();

    if(!query){
        status.textContent = "Please enter a movie name. ";
        movieList.innerHTML="";
        return;
    }
    currentQuery = query;
    currentPage = 1
    fetchMovies(currentQuery,currentPage);
});

async function fetchMovies(query,page){
    status.textContent = `Loading Results for ${query}...`;
    movieList.innerHTML="";

    try{
        const response = await fetch(`${apiUrl}?apikey=${apiKey}&s=${query}&page=${page}`);
        const data = await response.json();

        if(data.Response == "False"){
            console.log("no movies");
            if(data.Error === "Too many results."){
                status.textContent = `${data.Error} Please type a more specific name`;
            }
            else{
                status.textContent = data.Error;
            }
            return;
        }

        currentMovies = data.Search;
        totalResults = Number(data.totalResults);

        currentPage = page;

        renderMovies(sortMovies(currentMovies));
        renderPagination();
    }
    catch(error){
        status.textContent="Something went wrong. Please try again. "
        console.error(error);
    }
    
}
function getTotalPages(){
    return Math.ceil(totalResults / RESULTS_PER_PAGE);
}
function renderPagination(){
    const pagination = document.getElementById("pagination");
          pagination.innerHTML="";
    const totalPages = getTotalPages();

    if(currentPage > 1){
        const prevBtn = document.createElement("button");
        prevBtn.textContent = "← Prev";
        prevBtn.classList.add("pageButtons");
        
        prevBtn.addEventListener("click", event => {
            fetchMovies(currentQuery , currentPage-1);
        });
        pagination.appendChild(prevBtn);
    }

    const pageInfo = document.createElement("span");
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    pagination.appendChild(pageInfo);

    if(currentPage < totalPages){
        const nextBtn = document.createElement("button");
        nextBtn.textContent = "Next →"
        nextBtn.classList.add("pageButtons");

        nextBtn.addEventListener("click" , event => {
            fetchMovies(currentQuery,currentPage+1);
        });
        pagination.appendChild(nextBtn)
    }
}

function renderMovies(movies){
    movieList.innerHTML="";
    status.textContent="";

    movies.forEach(movie => {
        const li = document.createElement("li");
        li.dataset.id = movie.imdbID;
        li.classList.add("movie-item");
        const posterHTML = movie.Poster !== "N/A" ?`<img src="${movie.Poster }" alt = "${movie.Title}"/>`:`<div class="poster-placeholder">No Image</div>`; 
        li.innerHTML = `${posterHTML}
                        <div class="movie-info">
                        <h3>${movie.Title}</h3>
                        <p>${movie.Year}</p>
                        </div>`;
        movieList.appendChild(li);

        const img = li.querySelector("img");
        if(img){
            img.addEventListener("error", event =>{
                img.replaceWith(createPosterPlaceholder());
            })
        }
    });
}
function createPosterPlaceholder(){
    const div = document.createElement("div");
    div.className ="poster-placeholder";
    div.textContent = "Failed to Load";
    return div;
}
function extractYear(yearString){
    return Number(yearString.split("–")[0]);
}
function sortMovies(movies){
console.log("function called");
    // using slice avoids mutating the original array
    // slice creates a copy of the original array 
   const sorted = movies.slice();

   switch(currentSort){
    case "year-desc":
        return sorted.sort((a,b) => extractYear(b.Year)-extractYear(a.Year));
    case "year-asc":
        return sorted.sort((a,b) => extractYear(a.Year)-extractYear(b.Year));
    case "title-asc":
        return sorted.sort((a,b) => a.Title.localeCompare(b.Title));
    case "title-desc":
        return sorted.sort((a,b) => b.Title.localeCompare(a.Title));
    // case "rating-desc":
    //     return sorted.sort((a,b) => {
    //                         const ratingA = parseFloat(a.imdbRating) || 0;
    //                         const ratingB = parseFloat(b.imdbRating) || 0;
    //                         return ratingB -ratingB;
    //     });
    default:
        return sorted;
   }
}

sortSelect.addEventListener("change", event =>{
    if(currentMovies.length=== 0) return;
    currentSort = event.target.value;
    renderMovies(sortMovies(currentMovies));
});

movieList.addEventListener("click", event =>{
    const li = event.target.closest(".movie-item");
    if(!li){
        return;
    }
    const imdbID = li.dataset.id;
    fetchMovieDetails(imdbID);
});

async function fetchMovieDetails(imdbID) {
    try{
        const response = await fetch(`${apiUrl}?apikey=${apiKey}&i=${imdbID}`);
        const data = await response.json();
        console.log(data);

        showMovieDetails(data);
    }
    catch(error){
        alert("Failed to load details");
        console.log(error);
    }
}

function showMovieDetails(movie){
    const modalContent = document.getElementById("modal-content");
    modalContent.style.lineHeight = "1.5";
    modalContent.innerHTML = `<h2>${movie.Title}</h2>
                              <p><strong>Year:</strong>${movie.Year}</p>
                              <p><strong>Type:</strong>${movie.Type}</p>
                              <p><strong>Genre:</strong>${movie.Genre}</p>
                              <p><strong>Actors:</strong>${movie.Actors}</p>
                              <p><strong>Runtime:</strong>${movie.Runtime}</p>
                              <p><strong>Rating:</strong>⭐${movie.imdbRating}</p>
                              <p><strong>Plot:</strong>${movie.Plot}</p>
                              `;
    if(movie.Type.toLowerCase()==="series"){
        modalContent.innerHTML = `<h2>${movie.Title}</h2>
                              <p><strong>Year:</strong>${movie.Year}</p>
                              <p><strong>Type:</strong>${movie.Type}</p>
                              <p><strong>Genre:</strong>${movie.Genre}</p>
                              <p><strong>Actors:</strong>${movie.Actors}</p>
                              <p><strong>Seasons:</strong>${movie.totalSeasons}</p>
                              <p><strong>Rating:</strong>⭐${movie.imdbRating}</p>
                              <p><strong>Plot:</strong>${movie.Plot}</p>
                              `;
    }
    
    document.getElementById("modal-overlay").classList.remove("hidden");
}

document.getElementById("close-modal").addEventListener("click",event=>{
    document.getElementById("modal-overlay").classList.add("hidden");
});