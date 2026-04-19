import React from 'react'
import './About.css';
import { faker } from '@faker-js/faker';
import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";

function About() {
  return (
     <div className="about-container"> 
            <h1 className="about-title">About US</h1>
            <div className="about-section">
              <div className="row">
                <div className="col-md-6 about-content">
                    <img className="about-image" src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGhvc3BpdGFsfGVufDB8fDB8fHww" alt="Hospital" />
                </div> 
                <div className="col-md-6 about-content">
                    <h2>Who We are ?</h2>
                    <p> Mahavir Mediscope Eye Center is a premier eye care institution. {faker.lorem.paragraph(40)}</p>
                </div>
              </div> 

              <div className="row">
                <div className="col-md-6 about-content">
                    <h2>Our History</h2>
                    <p> Mahavir Mediscope Eye Center has a rich history of serving our patients with excellence. {faker.lorem.paragraph(40)}</p>
                </div>
                <div className="col-md-6 about-content">
                     <img className="about-image" src="https://image.freepik.com/free-photo/young-handsome-physician-medical-robe-with-stethoscope_1303-17818.jpg" alt="Doctor" />
                </div>
              </div>
            </div>

            <section id="team" className="team-area">
              <div className="container">
                <div className="row">
                  <div className="col-md-12">
                    <div className="site-heading text-center">
                      <h2>Our <span>Team</span></h2>
                      <h4>Meet our awesome and expert team members</h4>
                    </div>
                  </div>
                </div>
                <div className="row team-items">
                  <div className="col-md-4 single-item">
                    <div className="item">
                      <div className="thumb">
                        <img className="img-fluid" src="https://i.ibb.co/JC4skS0/team-animate.jpg" alt="Thumb"/>
                        <div className="overlay">
                          <h4>Dr. Manav Jain</h4>
                          <p>Phd Holder with specialist on Eye Therapy.</p>
                          <div className="social">
                            <ul>
                              <li className="facebook">
                                <a href='https://www.facebook.com/ChitkaraU/'>
                                  <FaFacebook />
                                </a>
                              </li>
                              <li className="twitter">
                                <a href='https://www.facebook.com/ChitkaraU/'>
                                  <FaTwitter />
                                </a>    
                              </li>
                              <li className="instagram">
                                <a href='https://www.facebook.com/ChitkaraU/'>
                                  <FaInstagram />
                                </a>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div className="info">
                        <span className="message">
                          <a href="icon"><i className="fas fa-envelope-open"></i></a>
                        </span>
                        <h4>Dr. Manav Jain</h4>
                        <span>LEAD DIRECTOR</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 single-item">
                    <div className="item">
                      <div className="thumb">
                        <img className="img-fluid" src="https://i.ibb.co/JC4skS0/team-animate.jpg" alt="Thumb"/>
                        <div className="overlay">
                          <h4>Aman Jain</h4>
                          <p>Musician</p>
                          <div className="social">
                            <ul>
                              <li className="facebook">
                                <a href='https://www.facebook.com/ChitkaraU/'>
                                  <FaFacebook />
                                </a>
                              </li>
                              <li className="twitter">
                                <a href='https://www.facebook.com/ChitkaraU/'>
                                  <FaTwitter />
                                </a>    
                              </li>
                              <li className="instagram">
                                <a href='https://www.facebook.com/ChitkaraU/'>
                                  <FaInstagram />
                                </a>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div className="info">
                        <span className="message">
                          <a href="icon"><i className="fas fa-envelope-open"></i></a>
                        </span>
                        <h4>Aman Jain</h4>
                        <span>App Developer</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 single-item">
                    <div className="item">
                      <div className="thumb">
                        <img className="img-fluid" src="https://i.ibb.co/JC4skS0/team-animate.jpg" alt="Thumb"/>
                        <div className="overlay">
                          <h4>Anju Jain</h4>
                          <p>Mother</p>
                          <div className="social">
                            <ul>
                              <li className="facebook">
                                <a href='https://www.facebook.com/ChitkaraU/'>
                                  <FaFacebook />
                                </a>
                              </li>
                              <li className="twitter">
                                <a href='https://www.facebook.com/ChitkaraU/'>
                                  <FaTwitter />
                                </a>    
                              </li>
                              <li className="instagram">
                                <a href='https://www.facebook.com/ChitkaraU/'>
                                  <FaInstagram />
                                </a>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div className="info">
                        <span className="message">
                          <a href="icon"><i className="fas fa-envelope-open"></i></a>
                        </span>
                        <h4>Anju Jain</h4>
                        <span>Web designer</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
        </div>
  )
}

export default About