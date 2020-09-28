import { Subject } from 'rxjs';
import { concat, from} from "rxjs";
import { merge, map, withLatestFrom, mergeMap, concatMap, concatAll, last } from 'rxjs/operators';

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
      resolve('s1: ' + g.transid);}, 1000)
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


let atmS = function(g){
return from(s1(g)).pipe(
  mergeMap(() => s2(g)),
  mergeMap(() => s3(g)))
}



var transactionSubscriber= transactionSubject.subscribe();

var networkSubscriber = networkStatus.subscribe();

const transactionObservable = transactionSubject.pipe(withLatestFrom(networkStatus), map(
  ([trans, status]) => {
  return {transid: trans,
  status: status}
}))


let persistTransactionObservable = transactionObservable.pipe(mergeMap((transaction) => atmS(transaction)));

persistTransactionObservable.subscribe(data => {
  console.log(data)
});

// let combined = transactionSubject.pipe(merge(networkStatus))



networkChange('online')
sendTransaction("t1");
sendTransaction("t2");
networkChange('offline')
sendTransaction("t3");



  

