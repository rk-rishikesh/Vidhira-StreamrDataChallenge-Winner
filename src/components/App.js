import Vidhira from '../abis/Vidhira.json'
import React, { Component } from 'react';
import Identicon from 'identicon.js';
import Navbar from './Navbar'
import Main from './Main'
import Web3 from 'web3';
import './App.css';
import StreamrClient from 'streamr-client';

let steno=0;
let count=0;
//Declare IPFS
const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }) // leaving out the arguments will default to these values


      const SHARED_SECRET = 'LN7cuyS5TC2iItqeYxSBXwu9-IU2d1SO--MbCAnUz2vw'
      const DU_CONTRACT = '0x96344ba422bfa9bb7bc34d42b8879b0443d3e430'
      const STREAM_ID = '0xa6e731e2ae87325b88dd1fac402676a5e6624a9c/Vidhira'
      
      const userwallet = StreamrClient.generateEthereumAccount()
      console.log(userwallet)

      const streamr = new StreamrClient({
        
        url: 'wss://hack.streamr.network/api/v1/ws',
        restUrl: 'https://hack.streamr.network/api/v1',
        auth: {
            privateKey: userwallet.privateKey,
            provider: window.web3.currentProvider,
        }
      })
      console.log(streamr)
      
      streamr.joinDataUnion(DU_CONTRACT, SHARED_SECRET)
              .then((memberDetails) => {
                console.log(memberDetails)
              })

class App extends Component {


  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3
    // Load account
    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })
    // Network ID
    const networkId = await web3.eth.net.getId()
    const networkData = Vidhira.networks[networkId]
    if(networkData) {
    
      const vidhira = new web3.eth.Contract(Vidhira.abi, networkData.address)
      this.setState({ vidhira })
      const imagesCount = await vidhira.methods.imageCount().call()
      count=imagesCount;
      this.setState({ imagesCount })
      // Load images
      for (var i = 1; i <= imagesCount; i++) {
        const image = await vidhira.methods.images(i).call()
        this.setState({
          images: [...this.state.images, image]
        })
      }
      
      this.setState({ loading: false})
    } else {
      window.alert('Vidhira contract not deployed to detected network.')
    }
  }

  captureFile = event => {

    event.preventDefault()
    const file = event.target.files[0]

    const name = event.target.files[0].name;
    console.log(name)
    var n = name.localeCompare('Output1.png');
    console.log(n);
    if (n == 0 ){
      //console.log("");
      steno=1;
    }
    console.log("pehla",steno)
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)

    reader.onloadend = () => {
        this.setState({ buffer: Buffer(reader.result) })
        console.log('buffer', this.state.buffer)
    }
    
  }

  uploadImage = description => {
    console.log("Submitting file to ipfs...")

    //adding file to the IPFS
    ipfs.add(this.state.buffer, (error, result) => {
      console.log('Ipfs result', result)
      if(error) {
        console.error(error)
        return
      }

      this.setState({ loading: true })
      this.state.images.forEach(image => {
        if (result[0].hash == image.hash && this.state.flag==false){
          this.setState({flag:true})
          this.state.vidhira.methods.uploadImage(result[0].hash,"Original Image ID  : ".concat(image.id.toString())).send({ from: this.state.account }).on('transactionHash', (hash) => {
          this.setState({ loading: false })
        })
      }
      });

      //freash Image
      if (this.state.flag==false){
      this.state.vidhira.methods.uploadImage(result[0].hash,description).send({ from: this.state.account }).on('transactionHash', (hash) => 
      {
        var dataPoint = {
          'image' : result[0].hash,
        }
        console.log(result[0].hash)
        streamr.publish(STREAM_ID, dataPoint)
        console.log(dataPoint.image) 
        this.setState({ loading: false })
      })
    }
    })
  }


  tipImageOwner(id, tipAmount) {
    this.setState({ loading: true })
    console.log(this.state.images[id-1][2].slice(0,18))
    const des = this.state.images[id-1][2].slice(0,18)
    console.log(this.state.images[id-1][2])
    if (this.state.images[id-1][2].slice(0,17) == "Original Image ID"){
      const orImgId = this.state.images[id-1][2].slice(21)
      console.log(orImgId)
      this.state.vidhira.methods.tipImageOwner(parseInt(orImgId)).send({ from: this.state.account, value: tipAmount }).on('transactionHash', (hash) => {
      this.setState({ loading: false })
      console.log('Yash')
      })
    }
    this.state.vidhira.methods.tipImageOwner(id).send({ from: this.state.account, value: tipAmount }).on('transactionHash', (hash) => {
    this.setState({ loading: false })
  })
    
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      vidhira: null,
      images: [],
      loading: true,
      flag: false,
    }

    this.uploadImage = this.uploadImage.bind(this)
    this.tipImageOwner = this.tipImageOwner.bind(this)
    this.captureFile = this.captureFile.bind(this)
  }



  render() {
    
    return (
      <div>
        <Navbar account={this.state.account} />
        { this.state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <Main
              images={this.state.images}
              captureFile={this.captureFile}
              uploadImage={this.uploadImage}
              tipImageOwner={this.tipImageOwner}
            />
        }
        
      </div>
      
    );
  }
}

export default App;