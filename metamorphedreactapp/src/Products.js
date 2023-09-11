import React, {useState, useEffect} from "react";
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import { ArrowRightCircleFill, ArrowDownCircle } from 'react-bootstrap-icons'
import no_image from './images/no-image-icon.png'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import { useLocation, Link } from "react-router-dom";
import Form from 'react-bootstrap/Form';

function Products() {
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState({})
    const [loadingProducts, setLoadingProducts] = useState(true)
    const [loadingCategories, setLoadingCategories] = useState(true)
    const [loadingBrands, setLoadingBrands] = useState(true)
    const [displayVariants, setDisplayVariants] = useState({})
    const [brands, setBrands] = useState({})
    const location = useLocation({state:{}})
    const [filtersApplied, setFiltersApplied] = useState(false)
    const [filteredBrands, setFilteredBrands] = useState({})
    const [filteredCategories, setFilteredCategories] = useState({})
    const [filteredVisibilities, setFilteredVisibilities] = useState({})
    const [selectedProductsIDs, setSelectedProductsIDs] = useState(new Set())
    const [selectedProducts, setSelectedProducts] = useState([])
    const [templates, setTemplates] = useState([])
    const [selectedTemplateID, setSelectedTemplateID] = useState()

    async function getCategories() {
        const url = `${process.env.REACT_APP_BACKEND}/get_categories/`
        const fetchConfig = {
            credentials: 'include',
        }
        const response = await fetch(url, fetchConfig);
        if (response.ok) {
            const data = await response.json();
            for (const [key, value] of Object.entries(data['categories'])) {
                categories[key] = value
            }
            setCategories({...categories})
        }
        setLoadingCategories(false)
    }

    async function getProducts() {
        const url = `${process.env.REACT_APP_BACKEND}/get_products/`;
        const fetchConfig = {
            credentials: "include",
        }
        const response = await fetch(url, fetchConfig);
        if (response.ok) {
          const data = await response.json();
          setProducts(data['products']);
        }
        setLoadingProducts(false)
      }

    async function getBrands() {
        const url = `${process.env.REACT_APP_BACKEND}/get_brands/`
        const fetchConfig = {
            credentials: 'include',
        }
        const response = await fetch(url, fetchConfig);
        if (response.ok) {
            const data = await response.json();
            for (const [key, value] of Object.entries(data['brands'])) {
                brands[key] = value
            }
            setBrands({...brands})
        }
        setLoadingBrands(false)
    }

    async function getTemplates() {
        const url = `${process.env.REACT_APP_BACKEND}/product_template/`
        const fetchConfig = {
            credentials: "include",
            method: "GET",
        }
        const response = await fetch(url, fetchConfig)
        if (response.ok) {
            const data = await response.json()
            var templatesList = []
            for (const template of Object.values(data['templates'])) {
                templatesList.push(template)
            }
            setTemplates(templatesList)
        }
    }

    useEffect(() => {
        getProducts()
        getCategories()
        getBrands()
        getTemplates()
    }, []);
    
    useEffect(() => {
        if (location['state']) {
            setFilteredBrands(location.state.filteredBrands)
            setFilteredCategories(location.state.filteredCategories)
            setFilteredVisibilities(location.state.filteredVisibilities)
            setFiltersApplied(true)
        }
    }, [location.state])

    if (loadingProducts || loadingCategories || loadingBrands) {
        return <div>Loading...</div>
    }

    if (products.length === 0) {
        return <div>No Products</div>
    }

    function ThumbnailImage(props) {
        for (const image of props.images) {
            if (image['is_thumbnail'] === true) {
                return (
                    <img src= {image['url_thumbnail']} alt='' style={{opacity: 0.65, height: '100px', width:'100px'}}/>
                )}}}

    function BrandName(props) {
        return (
            <div>
                {brands[props.brandID]}
            </div>
        )
    }
 
    function CategoryNames(props) {
        var categoryList = []
        for (const id of props.categoryIDs) {
            categoryList.push(categories[id])
        }
        return categoryList.join(', ')
    }

    function ProductVisibility(props) {
        if (props.visible) {
            return (
                <div style={{ color: 'white', backgroundColor: 'green', textAlign: 'center'}}>
                    Enabled
                </div>
            )}
        else {
            return (
                <div style={{ color: 'white', backgroundColor: 'red'}}>
                    Disabled
                </div>
            )}}

    function hasVariants(variants) {
        if (variants.length > 1) {
            return false // Set to True if enabling variants
        }
        return false
    }

    function ProductVariantArrow(props) {
        if (hasVariants(props.variants)) {
            if (!displayVariants[props.id]) {
                return (
                    <Button style= {{backgroundColor: '#D6ECFB', border:'0px', alignItems: 'center'}} onClick={() => changeDisplayVariants(props.id) }>
                        <ArrowRightCircleFill style= {{height: '25px', width: '25px', color: 'A3B9C8'}}/>
                    </Button>
                )}
            else {
                return (
                    <Button style= {{backgroundColor: '#D6ECFB', border:'0px', alignItems: 'center'}} onClick={() => changeDisplayVariants(props.id) }>
                        <ArrowDownCircle style= {{height: '25px', width: '25px', color: 'A3B9C8'}}/>
                    </Button>
                )}}}

    function VariantName(props) {
        var names = []
        for (const option of props.options) {
            names.push(option['label'])
        }
        return names.join(', ')
    }

    function changeDisplayVariants(id) {
        const newDisplayVariants = {}
        newDisplayVariants[id] = !(displayVariants[id] ?? false)
        setDisplayVariants(newDisplayVariants)
        return
    }

    function ProductVariants(props) {
        if (displayVariants[props.id] === true) {
            return (
                <>
                {props.variants.map((variant) => (
                    <tr key = {String(variant['id']) + String(variant['product_id'])} style={{backgroundColor: '#D6ECFB'}}>
                        <td></td>
                        <td>
                            {/* <input className="form-check-input" type="checkbox" id={variant['id']} value="" style={{ height:"26px", width:"26px" }}/> */}
                        </td>
                        <td>
                            <img src= {variant['image_url']} alt="" onError={(e) => (e.target.src = no_image)} style={{opacity: 0.65, height: '100px', width:'100px'}}/>
                        </td>
                        <td>
                            <VariantName options = {variant['option_values']}/>
                        </td>
                        <td></td>
                        <td></td>
                        <td>{variant['inventory_level']}</td>
                        <td></td>
                    </tr>
                ))}
                </>
            )}
        else {
            return
        }}

    function productFilter(product) {
        if (!filtersApplied) {
            return true
        }
        if (!filteredVisibilities.has(product.is_visible)) {
            return false
        }
        if (!filteredBrands.has(product.brand_id)) {
            return false
        }
        for (const category of product.categories) {
            if (filteredCategories.has(category)) {
                return true
                }
        }
        return false
    }

    function changeSelectedProducts(id) {
        var newSet = selectedProductsIDs
        if (!newSet.delete(id)) {
            newSet.add(id)
        }
        setSelectedProductsIDs(newSet)
        const selectedProductsList = products.filter((product) => selectedProductsIDs.has(product.id))
        setSelectedProducts(selectedProductsList)
    }

    function TemplateSelection() {
        return (
            <></>
        )
    }

    function ProductTable(props) {
        return (
        <Table>
            <thead>
                <tr>
                    <th></th>
                    <th></th>
                    <th>Image</th>
                    <th>Product</th>
                    <th>Brand</th>
                    <th>Categories</th>
                    <th>Description</th>
                    <th>Page Title</th>
                    <th>Meta Keywords</th>
                    <th>Meta Description</th>
                    <th>Stock</th>
                    <th>Visibility</th>
                </tr>
            </thead>
            <tbody style={{overflowY:'scroll'}}>
                {props.productList.filter(productFilter).map((product) => (
                    <React.Fragment key={product['id']}>
                    <tr style={{backgroundColor: '#D6ECFB', height:'30px', overflow:'scroll'}}>
                        <td>
                            <input className="form-check-input" type="checkbox" id={product['id']} style={{ height:"26px", width:"26px" }} onClick={() => changeSelectedProducts(product['id'])} defaultChecked={selectedProductsIDs.has(product['id'])}/>
                        </td>
                        <td>
                            <ProductVariantArrow variants = {product['variants']} id = {product['id']}/>
                        </td>
                        <td>
                            <ThumbnailImage images = {product['images']}/>
                        </td>
                        <td>{product['name']}</td>
                        <td>
                            <BrandName brandID = {product['brand_id']}/>
                        </td>
                        <td>
                            <CategoryNames categoryIDs = {product['categories']}/>
                        </td>
                        <td>
                            <div style={{maxHeight:'150px', overflowY:'auto'}}>
                                {product['description']}
                            </div>
                        </td>
                        <td>{product['page_title']}</td>
                        <td>
                            <div style={{maxHeight:'150px', overflowY:'auto'}}>
                                {product['meta_description']}
                            </div>
                        </td>
                        <td>{product['meta_keywords']}</td>
                        <td>{product['inventory_level']}</td>
                        <td>
                            <ProductVisibility visible={product['is_visible']}/>
                        </td>
                    </tr>
                    <ProductVariants id = {product['id']} variants = {product['variants']}/>
                    </React.Fragment>
                ))}
            </tbody>
        </Table>   
        )}

    function ProductTemplateLink() {
        return (
            <Link to='/productTemplate' state={{products: products, brands: brands, categories: categories}}>
            <h3>Product Template</h3>
            </Link>
        )
    }

    function ProductTemplateDropDown() {
        console.log('TEMPLATES:', templates)
        return (
            <Form.Select>
                <option>Select Product Template to Apply</option>
                {templates.map((template)=> (
                    <option>{template['template_name']}</option>
                ))}
            </Form.Select>
        )
    }
    
    return (
        <Container>
            <Row>
                <Col style= {{textAlign: 'center'}}>
                    <h1>Products</h1>
                </Col>
            </Row>
            <Row>
                <Col>
                    <ProductTemplateLink/>
                </Col>
                <Col style = {{textAlign: 'right'}}>
                    <Link to='/filters' state={{brands: brands, categories: categories}}>
                        <h2>Filters</h2>
                    </Link>
                    <Button variant="outline-dark" onClick={()=> {setFiltersApplied(false); setFilteredBrands({}); setFilteredCategories({}); setFilteredVisibilities({})}}>Clear Filters</Button>
                </Col>
            </Row>
            <Row>
                <Col>
                    <ProductTemplateDropDown/>
                </Col>
            </Row>
            <Row>
                <Col>
                    <ProductTable productList = {products}/>
                </Col>
            </Row>
        </Container>
    );
}

export default Products;
