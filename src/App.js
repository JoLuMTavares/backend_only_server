import React, { Component } from 'react';
import './././scss/main.scss';

import {Route, Routes } from 'react-router-dom';

import createSelector from './selector';

import Home from './pages/Home';
import NotesList from './pages/NotesList';
import NoteDetails from './pages/NoteDetails';
import AddNote from './pages/AddNote';
import UploadImage from './pages/UploadImage';

import About from './pages/About';
// import Settings from './pages/Settings';
import SuccessLogin from './components/UserLog/SuccessLogin';
import SuccessLogout from './components/UserLog/SuccessLogout';

import Header from './components/Header'
// import Navigation from './layouts/Navigation';

import Error404 from './pages/Error404';
import Register from './components/UserReg/Register';
import Login from './components/UserLog/Login';
import Logout from './components/UserLog/Logout';

import Management from './components/Management/Management';

import config from './config.json';
import { connect } from 'react-redux';
// import NoteTypeScreen from './pages/NoteTypeScreen';


class App extends Component  {

  constructor() {
    super();

    window.compactNotesHost = config.host;
    window.compactNotesBackend = config.backend;

  }

  state = {
    token: '',
    error1: '',
    error2: '',
    error3: '',
    prevPage: '/',
    befPrevPage: '',
    homePage: true,
    aboutPage: false,
    user: '',
    login: false,
    loggedin: false,
    register: false,
    showLoggedOut: false // This is to load the SuccessLogout component
  }


    /**
     * When the component mounts, the local storage is checked to find the
     * existance of a token. If so, the loggedin element is updated as true.
     * However, this may not be needed. The reducer has the information
     * persistent (and stored in the local storage). That's how the information
     * about a logged user is obtained (and that's not done here).
     */
   async componentDidMount() {
      if (localStorage.length > 0 && localStorage.getItem('token') !== null && localStorage.getItem('token') !== undefined) {
        this.setState({
          loggedin: true,
          login: false,
        });
      }
      else
        this.setState({
          loggedin: false
        });
  }


  /**
   *
   * This function updates the pages references.
   * The previous page gets the reference of the current one.
   * While the current page gets the reference of the new page.
   * The newPage comes from the Navigation functional component.
   *
   * @param {*} newPage
   */
  updatePages = newPage => {
    // event.preventDefault(); // Prevents page from reload
    this.setState({
      befPrevPage: this.state.prevPage,
      prevPage: newPage
    });
  }

  /**
   * This function does checks for the existance of a token in the local storage.
   * If it's found, the loggedin element is updated with the valu 'true'. If not,
   * the loggedin is set to false.
   */
  checkLogged = () => {
    if (localStorage.getItem('token') !== null && localStorage.getItem('token') !== undefined)
      this.setState({
        loggedin: true
      });
    else
    this.setState({
      loggedin: false
    });
  }



  render() {

    return (
        <div className='App'>
            <Header
              title='Compact Notes'
              updatePages={this.updatePages}
            />
            {/* There's one group of route paths. Not all components
              * are visible, unless the user is logged in.
              */}
            <Routes>
              {/* <Route path='/' element={<Login />}></Route> */}
              <Route path='/' element={<Home />}></Route>
              <Route path='/home' element={<Home />}></Route>
              <Route path='/NotesList' element={<NotesList />}></Route> {/* Registered users */}
              {/* <Route path='/settings' element={<Settings />}></Route> Registered users */}
              <Route path='/NoteDetails/:id' element={<NoteDetails />}></Route> {/* Registered users */}
              <Route exact path='AddNote' element={< AddNote />}/> {/* Registered users */}
              {/* <Route exact path='notetypescreen' element={<NoteTypeScreen />}/> Registered users */}
              <Route exact path='UploadImage' element={< UploadImage />}/> {/* Registered users */}
              <Route path='/about' element={<About />}></Route>
              {/* <Route path='/Settings' element={<Settings />}></Route> */}
              <Route path='/management' element={<Management />} /> {/* Registry process */}
              <Route path='/register' element={<Register />} />
              <Route path='/login' element={<Login value={this.state} />}/>
              <Route exact path='/logout' element={<Logout />}></Route>
              <Route path='/loggedin' component={SuccessLogin} />
              <Route path='/loggedout' component={SuccessLogout} />

              <Route element={<Error404 />} />
            </Routes>
            {/* <Navigation
              title='Compact Notes'
              updatePages={this.updatePages}
            /> */}
        </div>
        )
  }
}


const mapStateToProps = (state) => ({
  user: createSelector.userSelector(state),
});

const mapDispatchToProps = (dispatch, state) => ({

});

export default connect(mapStateToProps, mapDispatchToProps)(App);