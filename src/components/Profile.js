import React, { Component } from 'react';
import { Card, InputGroup } from 'react-bootstrap';
import "./ProfileBox.css";
import Identicon from 'identicon.js';
class Profile extends Component {
  render() {
    return (

    <div>

        <div class="InputSection">
          <div className="col-lg-12 ml-auto mr-auto" style={{ maxWidth: '500px' }}>
          <br></br>
          <br></br>
          { this.props.images.map((image, key) => {
                if(this.props.account == image.author){
                  return(
                    <div className="card mb-4" key={key} >

                      <ul id="imageList" className="list-group list-group-flush">
                        <li className="list-group-item">
                          <p class="text-center"><img src={`https://ipfs.infura.io/ipfs/${image.hash}`} style={{ maxWidth: '420px'}}/></p>
                          
                          <p class="text-dark font-italic">{image.description}</p>
                        </li>
                        <li key={key} className="list-group-item py-2">
                          <small className="float-left mt-1 text-muted">
                            {image.tipAmount.toString()} Likes
                          </small>
                        </li>
                      </ul>
                    </div>
                  )
                }
                
              })}
            
          </div>
        </div>
  
    </div>
    );
  }
}

export default Profile;