import fetchRetry from 'fetch-retry';
import * as actions from './actionTypes';
import constants from '../constants';
const baseUrl = `http://puzzle.${constants.minikubeIp}.xip.io/puzzle/v1`;
//const baseUrl = `http://localhost:3000/puzzle/v1`;
const arrowDisplayTime = 1000;

export function getPuzzleDataSuccess (json) {
  return {type: actions.puzzle.GET_PUZZLE_DATA_SUCCESS, data: json};
}

export function getPuzzleDataFailure () {
  return {type: actions.puzzle.GET_PUZZLE_DATA_FAILURE};
}

export function getPuzzleData () {
  return dispatch => {
    dispatch({type: actions.puzzle.PUZZLE_LOADING});
    console.log("baseUrl " + baseUrl)
    return fetchRetry(`${baseUrl}/crossword`, {
      retries: 36,
      retryDelay: 5000
    })
      .then((resp) => {
        console.log("1", resp)
        return resp.json();
      })
      .then((json) => {
        console.log("Response Data:", json);
        if (json[0].fromCache) {
          console.log("2")
          dispatch({type: actions.puzzle.FROM_CACHE, data: true});
          setTimeout(() => {
            return dispatch({type: actions.puzzle.FROM_CACHE, data: false});
          }, arrowDisplayTime);
        } else {
          console.log("3")
          dispatch({type: actions.puzzle.FROM_MONGO, data: true});
          setTimeout(() => {
            return dispatch({type: actions.puzzle.FROM_MONGO, data: false});
          }, arrowDisplayTime);
        }
        console.log("4")
        return dispatch(getPuzzleDataSuccess(json[0]));
      })
      .catch(err => {
        console.log("ABC " + err);
        dispatch(getPuzzleDataFailure(err));
      });
  };
}

export function submitPuzzleDataSuccess (json) {
  return {type: actions.puzzle.SUBMIT_PUZZLE_DATA_SUCCESS, data: json};
}

export function submitPuzzleDataFailure () {
  return {type: actions.puzzle.SUBMIT_PUZZLE_DATA_FAILURE};
}

export function submitPuzzleData (data) {
  return dispatch => {
    const submission = JSON.stringify(data);
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    return fetch(`${baseUrl}/crossword`, {
      method: 'PUT',
      headers,
      body: submission
    })
      .then((resp) => {
        if (resp.status === 204) {
          dispatch(submitPuzzleDataSuccess(data));
        } else {
          dispatch(submitPuzzleDataFailure);
        }
      })
      .catch((err) => {
        dispatch(submitPuzzleDataFailure);
      });
  };
}

export function clearPuzzleData (data) {
  return dispatch => {
    return fetch(`${baseUrl}/crossword/clear`, {
      method: 'PUT'
    })
      .then((resp) => {
        if (resp.status === 204) {
          dispatch({type: actions.puzzle.CLEAR_PUZZLE_DATA, data});
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };
}

export function sendingData () {
  return dispatch => {
    dispatch({type: actions.puzzle.SENDING_DATA, data: true});
    setTimeout(() => {
      return dispatch({type: actions.puzzle.SENDING_DATA, data: false});
    }, arrowDisplayTime);
  };
}

export function fromCache () {
  return dispatch => {
    dispatch({type: actions.puzzle.FROM_CACHE, data: true});
    setTimeout(() => {
      return dispatch({type: actions.puzzle.FROM_CACHE, data: false});
    }, arrowDisplayTime);
  };
}

export function fromMongo () {
  return dispatch => {
    dispatch({type: actions.puzzle.FROM_MONGO, data: true});
    setTimeout(() => {
      return dispatch({type: actions.puzzle.FROM_MONGO, data: false});
    }, arrowDisplayTime);
  };
}
