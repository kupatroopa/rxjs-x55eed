import { Subject } from 'rxjs';
import { concat, from, of, throwError, iif} from "rxjs";
import { merge, map, withLatestFrom, mergeMap, concatMap, concatAll, last, catchError } from 'rxjs/operators';

let cntr = 0;
const transactionSubject = new Subject();
const networkStatus = new Subject();

var networkChange = function(status){
  networkStatus.next(status)
}

var sendTransaction = function(payload){
  transactionSubject.next(payload)
  // if(cntr === 0){
  //   setTimeout(()=>  transactionSubject.next(payload), 100);
  //   cntr ++;
  // }else{
  //    setTimeout(()=>  transactionSubject.next(payload), 10);
  //    cntr ++;
  // }
 
  console.log("hello")
  
}

function s1(g){
  return new Promise((resolve, reject) => {
    setTimeout(()=> {
      console.log("s1 execute: " + g.transid);
      reject();}, 1000)
});
}

function s2(g){
  return new Promise((resolve, reject) => {
  setTimeout(()=> {
    console.log("s2 execute: "+ g.transid);
    resolve('s2: '+ g.transid);}, 10)
});

}

function s3(g){
  return new Promise((resolve, reject) => {
  setTimeout(()=> {
    console.log("s3 execute: " +g.transid);
    resolve('s3: '+ g.transid);}, 200)
});
}

function s4(g){
  return new Promise((resolve, reject) => {
  setTimeout(()=> {
    console.log("s4 execute: " +g.transid);
    resolve('s4: '+ g.transid);}, 200)
});
}

function revertS1(g){
  return new Promise((resolve, reject) => {
  setTimeout(()=> {
    console.log("Reverting S1");
    resolve();}, 200)
});
}

function revertS2(g){
  return new Promise((resolve, reject) => {
  setTimeout(()=> {
    console.log("Reverting S2");
    resolve();}, 200)
});
}


let atmS = function(g){
return from(s1(g)).pipe(
  catchError(err => {
    return from(revertS1('2')).pipe(concatMap(()=> throwError(err))
  )}),
  mergeMap(() => s2(g)),
  catchError(err => {
    return from(revertS2('2')).pipe(concatMap(()=> throwError(err))
  )}),
  mergeMap(() => s3(g)),
  catchError(err => {
    return throwError(err)
  }),
  mergeMap(() => s4(g)),
  catchError(err => {
    return of({error: err});
  }))
}



var transactionSubscriber= transactionSubject.subscribe();

var networkSubscriber = networkStatus.subscribe();

const transactionObservable = transactionSubject.pipe(withLatestFrom(networkStatus), map(
  ([trans, status]) => {
  return {transid: trans,
  status: status}
}))


let persistTransactionObservable = transactionObservable.pipe(concatMap((transaction) => atmS(transaction)));

persistTransactionObservable.subscribe(data => {
  console.log(data)
});

// let combined = transactionSubject.pipe(merge(networkStatus))



networkChange('online')
sendTransaction("t1");
sendTransaction("t2");
networkChange('offline')
sendTransaction("t3");



  

