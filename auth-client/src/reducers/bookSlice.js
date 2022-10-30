import { createSlice, createAsyncThunk, isAllOf, current } from "@reduxjs/toolkit";
import apiClient,{booksApi, book_url} from "../services/api";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import {useHistory} from 'react-router-dom';
import store from "../store";
import { useBooksQuery } from "../services/api";
const initialState = {
  bookItems: [],
  total: 0,
  per_page : 0,
  current_page : 1,
  last_page : 0,
  isLoggedIn: false,
  isLoading: true,
};


//Fetch
// export const getBookItems = createAsyncThunk("book/getBookItems", () => {
//   return fetch(url)
//     .then((resp) => resp.json())
//     .catch((err) => console.log(err));
// });

//Axios
// ThunkAPI can get the state of the APP and access andinvoke functions on the state
export const getBookItems = createAsyncThunk(
  "book/getBookItems",
  async (name, thunkAPI) => {
    try {
      apiClient.interceptors.request.use(config => {
        config.headers['Authorization'] = `Bearer ${Cookies.get('access_token')}`;
        return config;
      });
      const resp = await apiClient.get(book_url);
      return resp.data;
    } catch (error) {
      return thunkAPI.rejectWithValue("something went wrong");
    }
  }
);

const bookSlice = createSlice({
  name: "book",
  initialState,
  reducers: {
    clearBookList: (state) => {
      state.bookItems = [];
    },
    removeItem: (state, action) => {
      const itemId = action.payload;
      state.bookItems = state.bookItems.filter((item) => item.id !== itemId);
    },
    setPageItem: (state,action) => {
      // state.current_page = action.payload
      return {
        ...state,
        current_page : action.payload
      }
      // console.log(useBooksQuery(action.payload))
    },
    setLoggedIn: (state) => {
      state.isLoggedIn = true
      sessionStorage.setItem('loggedIn',true)
    },
    setLoggedOut: (state) => {
      state.isLoggedIn = false
      sessionStorage.setItem('loggedIn',false)
    }
   
  },
  extraReducers: (builder) => {
    
    builder
    .addMatcher(
      isAllOf(booksApi.endpoints.books.matchFulfilled),
      (state, payload ) => {
        console.log('createApi -> extraReducers -> Books Index Listener, state and payload',state,payload)
        
        //setting responsed data to store by api endpoints rtk-query listener
        // state.bookItems = [...payload.payload.data.books.data,1] ;
        // state.total = payload.payload.data.books.total
        // state.per_page = payload.payload.data.books.per_page
        // state.current_page = payload.payload.data.books.current_page
        // state.last_page = payload.payload.data.books.last_page

        return {
          ...state,
          bookItems : payload.payload.data.books.data,
          total : payload.payload.data.books.total,
          per_page : payload.payload.data.books.per_page,
          current_page : payload.payload.data.books.current_page,
          last_page : payload.payload.data.books.last_page

        }
      }
    )
    .addMatcher(
      isAllOf(booksApi.endpoints.addBook.matchFulfilled),
      (state, payload ) => {
        console.log('Create reducer m',state)
        console.log('Create from extra reducer',state.bookItems)
      }
    )
    .addMatcher(
      isAllOf(booksApi.endpoints.deleteBook.matchFulfilled),
      (state, payload ) => {
        let bookId = payload.payload.originalArg
        const { bookItems, current_page, isLoading, isLoggedIn, last_page, per_page, total } = current(state)
        state.bookItems = state.bookItems.filter((book) => book.id !== bookId);
        state.total = total - 1
        // after removing
        console.log('Endpoint Hook listeners => state',bookItems,total)
      }
    )
    .addMatcher(
      isAllOf(booksApi.endpoints.deleteBook.matchRejected),
      (state, payload ) => {
        console.log(state,payload)
        let data = payload.payload.data
        console.log(payload.payload.data.errors)
        
        let errors = Object.entries(payload.payload.data.errors).map(([key, value])=>(
          value
        ))

        Swal.fire({
            text: errors,
            icon:"error"
        })
        
      }
    )
  },
  // {
  //   [getBookItems.pending]: (state) => {
  //     state.isLoading = true;
  //   },
  //   [getBookItems.fulfilled]: (state, action) => {
  //     console.log(action);
  //     state.isLoading = false;
  //     state.bookItems = action.payload.data.books.data
  //   },
  //   [getBookItems.rejected]: (state, action) => {
  //     console.log(action);
  //     state.isLoading = false;
  //   },
  // },
});





//console.log(bookSlice);
export const { clearBookList, nextPage,removeItem, setLoggedIn, setLoggedOut, setPageItem } = bookSlice.actions;

export default bookSlice.reducer;
