import { Subject } from 'rxjs';
import { concat, from, of, throwError, iif, combineLatest} from "rxjs";
import { merge, map, withLatestFrom, mergeMap, concatMap, concatAll, last, catchError, filter, publish, share } from 'rxjs/operators';

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
 
  console.log("Recieved Transaction: " + payload)
  
}

function s1(g){
  return new Promise((resolve, reject) => {
    setTimeout(()=> {
      console.log("s1 execute: " + g.transid);
        resolve('s1: '+ g.transid);},
        //reject({chainid: 1});}, 
      1000)
});
}

function s2(g){
  return new Promise((resolve, reject) => {
  setTimeout(()=> {
    console.log("s2 execute: "+ g.transid);
    resolve('s2: '+ g.transid);},
    //reject({chainid: 2});}, 
    10)
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

function u1(g){
  return new Promise((resolve, reject) => {
  setTimeout(()=> {
    console.log("u1 execute: " +g.transid);
    resolve(g);}, 200)
});
}

function u2(g){
  return new Promise((resolve, reject) => {
  setTimeout(()=> {
    console.log("u2 execute: " +g.transid);
    resolve('u2: '+ g.transid);}, 200)
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


let atmS = function(rs){
return from(s1(rs.transaction)).pipe(
  catchError(err => {
    return throwError(err); //from(revertS1('2')).pipe(concatMap(()=> throwError(err))
  }),
  mergeMap(() => s2(rs.transaction)),
  catchError(err => {
    //console.log(err.chainid)
    if(err.chainid === 2){
      return from(revertS2('2')).pipe(concatMap(()=> throwError(err)))
    }else{
      return throwError(err)
    }
    
  }),
  mergeMap(rsy => {
    return s3(rs.transaction)
    }),
  catchError(err => {
    return throwError(err)
  }),
  mergeMap(() => s4(rs.transaction)),
  catchError(err => {
    return of({error: err});
  }),
  mergeMap((rsy) => {
    //console.log("HJJ"+ JSON.stringify(rs))
    if(rs.networkStatus === 'offline'){
      return of(null)
    }else{
      return from(u1(rs.transaction))
    }
  }))
}



var transactionSubscriber= transactionSubject.subscribe();

var networkSubscriber = networkStatus.subscribe();

const transactionObservable = transactionSubject.pipe(
  withLatestFrom(networkStatus), 
  map(
    ([trans, status]) => {
    return {transid: trans,
    status: status}}
  ),
  publish()
)

transactionObservable.connect()


let persistTransactionObservable = transactionSubject.pipe(withLatestFrom(networkStatus),map((rs)=> {
  return {transaction: {transid: rs[0]}, networkStatus: rs[1]}
}),concatMap((rs) => {return atmS(rs)}), publish());

persistTransactionObservable.connect()

let rsObservable = persistTransactionObservable.pipe(
  filter(rs => {return rs !== null}),
  mergeMap(rs => from(u2(rs))),
  publish()
)

rsObservable.connect()

persistTransactionObservable.subscribe(data => {
  console.log("Transaction persist ")
});

rsObservable.subscribe(data => {
   //console.log(data)
})

// let combined = transactionSubject.pipe(merge(networkStatus))


networkChange('online')
sendTransaction("t0");
sendTransaction("t1");
networkChange('online')
sendTransaction("t2");
networkChange('offline')
sendTransaction("t3");
sendTransaction("t4");
sendTransaction("t5");



  

