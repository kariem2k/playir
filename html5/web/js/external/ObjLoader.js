/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : ObjLoader.js
 * Description : Based on Robert Bateman's C++ OpenGL ObjLoader tutorials
                 http://nccastaff.bournemouth.ac.uk/jmacey/RobTheBloke/www/
 *
 * Created     : 15/10/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function ObjVertex()
{
    this.x = 0.0;     //  The x component of the vertex position
    this.y = 0.0;     //  The y component of the vertex position
    this.z = 0.0;     //  The z component of the vertex position
}


function ObjNormal()
{
    this.x = 0.0;     //  The x component of the normal vector
    this.y = 0.0;     //  The y component of the normal vector
    this.z = 0.0;     //  The z component of the normal vector
}


function ObjTexCoord()
{
    this.u = 0.0;     // The u parametric texturing co-ordinate
    this.v = 0.0;     // The v parametric texturing co-ordinate
}


function ObjFace()
{
    this.m_aVertexIndices = [];             /*  array of indicies that reference the vertex array in the mesh   */
    this.m_aNormalIndices = [];             /*  array of indicies that reference the normal array in the mesh   */
    this.m_aTexCoordIndicies = [];          /*  array of indicies that reference the uv coordinate array in the mesh    */
    this.m_iVertexCount = 0;                /*  the number of vertices that make up this mesh, ie, 3 = triangle; 4 = quad etc */
}


function ObjMesh()
{
    this.m_aVertexArray = null;             /*  Array of vertices that make up this mesh    */
    this.m_aNormalArray = null;             /*  Array of normals that make up this mesh     */
    this.m_aTexCoordArray = null;           /*  Array of texturing co-ordinates that make up this mesh */
    this.m_aFaces = null;                   /*  Array of faces that make up this mesh */

    this.m_iNumberOfVertices = 0;           /*  The number of vertices in the m_aVertexArray array  */
    this.m_iNumberOfNormals = 0;            /*  The number of normals in the m_aNormalArray array   */
    this.m_iNumberOfTexCoords = 0;          /*  The number of uv's in the m_aTexCoordArray array    */
    this.m_iNumberOfFaces = 0;              /*  The number of faces in the m_aFaces array           */
}


ObjMesh.LoadOBJ = function(fileData)
{
    var lines = fileData.split( "\n" );
    var linesLength = lines.length;

    /*
    **  Create the mesh structure and add it to the linked list
    */
    var pMesh = new ObjMesh();

    /*
    **  Run through the whole file looking for the various flags so that we can count
    **  up how many data elements there are. This is done so that we can make one memory
    **  allocation for the meshes data and then run through the file once more, this time
    **  reading in the data. It's purely done to reduce system overhead of memory allocation due
    **  to otherwise needing to reallocate data everytime we read in a new element.
    */
    var i, buffer;
    for( i=0; i<linesLength; ++i )
    {
        /*  Grab a line at a time   */
        buffer = lines[i];

        /*  look for the 'vn' - vertex normal - flag    */
        if( String.strncmp( "vn ", buffer, 3 ) )
        {
            ++pMesh.m_iNumberOfNormals;
        }

        /*  look for the 'vt' - texturing co-ordinate - flag  */
        else if( String.strncmp( "vt ", buffer, 3 ) )
        {
            ++pMesh.m_iNumberOfTexCoords;
        }

        /*  look for the 'v ' - vertex co-ordinate - flag  */
        else if( String.strncmp( "v ", buffer, 2 ) )
        {
            ++pMesh.m_iNumberOfVertices;
        }

        /*  look for the 'f ' - face - flag  */
        else if( String.strncmp( "f ", buffer, 2 ) )
        {
            ++pMesh.m_iNumberOfFaces;
        }
    }

    /*
    **  Allocate the memory for the data arrays and check that it allocated ok
    */
    CC.ASSERT( pMesh.m_iNumberOfVertices > 0 );
    pMesh.m_aVertexArray = new Array( pMesh.m_iNumberOfVertices );
    for( i=0; i<pMesh.m_aVertexArray.length; ++i )
    {
        pMesh.m_aVertexArray[i] = new ObjVertex();
    }

    /*  there are occasionally times when the obj does not have any normals in it */
    if( pMesh.m_iNumberOfNormals > 0 )
    {
        pMesh.m_aNormalArray = new Array( pMesh.m_iNumberOfNormals );
        for( i=0; i<pMesh.m_aNormalArray.length; ++i )
        {
            pMesh.m_aNormalArray[i] = new ObjNormal();
        }
    }

    /*  there are occasionally times when the obj does not have any tex coords in it */
    if( pMesh.m_iNumberOfTexCoords > 0 )
    {
        pMesh.m_aTexCoordArray = new Array( pMesh.m_iNumberOfTexCoords );
        for( i=0; i<pMesh.m_aTexCoordArray.length; ++i )
        {
            pMesh.m_aTexCoordArray[i] = new ObjTexCoord();
        }
    }

    pMesh.m_aFaces = new Array( pMesh.m_iNumberOfFaces );
    for( i=0; i<pMesh.m_aFaces.length; ++i )
    {
        pMesh.m_aFaces[i] = new ObjFace();
    }

    var vc=0,nc=0,tc=0,fc=0;
    for( var lineIndex=0; lineIndex<linesLength; ++lineIndex )
    {
        /*  Grab a line at a time   */
        buffer = lines[lineIndex];
        var values = buffer.split( " " );

        // Check for bad data
        if( values.length > 1 )
        {
            if( values[1] === "" )
            {
                for( i=1; i<values.length-1; ++i )
                {
                    values[i] = values[i+1];
                }
                values.length--;
            }
        }

        /*  look for the 'vn' - vertex normal - flag    */
        if( values[0] === "vn" )
        {
            CC.ASSERT( nc < pMesh.m_iNumberOfNormals );
            pMesh.m_aNormalArray[ nc ].x = parseFloat( values[1] );
            pMesh.m_aNormalArray[ nc ].y = parseFloat( values[2] );
            pMesh.m_aNormalArray[ nc ].z = parseFloat( values[3] );
            ++nc;
        }

        /*  look for the 'vt' - texturing co-ordinate - flag  */
        else if( values[0] === "vt" )
        {
            CC.ASSERT( tc < pMesh.m_iNumberOfTexCoords );
            pMesh.m_aTexCoordArray[ tc ].u = parseFloat( values[1] );
            pMesh.m_aTexCoordArray[ tc ].v = parseFloat( values[2] );
            ++tc;
        }

        /*  look for the 'v ' - vertex co-ordinate - flag  */
        else if( values[0] === "v" )
        {
            CC.ASSERT( vc < pMesh.m_iNumberOfVertices );
            var x = parseFloat( values[1] );
            var y = parseFloat( values[2] );
            var z = parseFloat( values[3] );
            pMesh.m_aVertexArray[ vc ].x = x;
            pMesh.m_aVertexArray[ vc ].y = y;
            pMesh.m_aVertexArray[ vc ].z = z;
            ++vc;
        }

        /*  look for the 'f ' - face - flag  */
        else if( values[0] === "f" )
        {
            /*
            **  Pointer to the face we are currently dealing with. It's only used so that
            **  the code becomes more readable and I have less to type.
            */
            CC.ASSERT( fc < pMesh.m_iNumberOfFaces );
            var pf = pMesh.m_aFaces[ fc ];

            /*
            **  These next few lines are used to figure out how many '/' characters there
            **  are in the string. This gives us the information we need to find out how
            **  many vertices are used in this face (by dividing by two)
            */
            var ii = 0;
            for( i=0; i<buffer.length; ++i )
            {
                if( buffer[i] === '/' )
                {
                    ii++;
                }
            }

            if( ii > 0 )
            {
                /*
                **  Allocate the indices for the vertices of this face
                */
                pf.m_aVertexIndices         = new Array( ii );

                /*
                **  Allocate the indices for the normals of this face only if the obj file
                **  has normals stored in it.
                */
                if( pMesh.m_iNumberOfNormals > 0 )
                {
                    pf.m_aNormalIndices     = new Array( ii );
                }

                /*
                **  Allocate the indices for the texturing co-ordinates of this face only if the obj file
                **  has texturing co-ordinates stored in it.
                */
                if( pMesh.m_iNumberOfTexCoords > 0 )
                {
                    pf.m_aTexCoordIndicies  = new Array( ii );
                }
            }

            /*
            **  tokenise the string using strtok(). Basically this splits the string up
            **  and removes the spaces from each chunk. This way we only have to deal with
            **  one set of indices at a time for each of the poly's vertices.
            */
            var vertexIndex = 0;
            for( var face=1; face<values.length; ++face )
            {
                var splitValues = values[face].split( "/" );
                if( splitValues.length > 1 )
                {
                    if( tc > 0 && nc > 0 )
                    {
                        pf.m_aVertexIndices[vertexIndex] = splitValues[0];
                        pf.m_aTexCoordIndicies[vertexIndex] = splitValues[1].length > 0 ? splitValues[1] : 0;
                        pf.m_aNormalIndices[vertexIndex] = splitValues[2];

                        /* need to reduce the indices by 1 because array indices start at 0, obj starts at 1  */
                        if( pf.m_aTexCoordIndicies[vertexIndex] > 0 )
                        {
                            --pf.m_aTexCoordIndicies[vertexIndex];
                        }

                        if( pf.m_aNormalIndices[vertexIndex] > 0 )
                        {
                            --pf.m_aNormalIndices[vertexIndex];
                        }

                        CC.ASSERT( pf.m_aTexCoordIndicies[vertexIndex] < pMesh.m_iNumberOfTexCoords );
                    }
                    else if( tc > 0 )
                    {
                        pf.m_aVertexIndices[vertexIndex] = splitValues[0];
                        pf.m_aTexCoordIndicies[vertexIndex] = splitValues[1];

                        /* need to reduce the indices by 1 because array indices start at 0, obj starts at 1  */
                        if( pf.m_aTexCoordIndicies[vertexIndex] > 0 )
                        {
                            --pf.m_aTexCoordIndicies[vertexIndex];
                        }

                        CC.ASSERT( pf.m_aTexCoordIndicies[vertexIndex] < pMesh.m_iNumberOfTexCoords );
                    }
                    else if( nc > 0 )
                    {
                        pf.m_aVertexIndices[vertexIndex] = splitValues[0];
                        pf.m_aNormalIndices[vertexIndex] = splitValues[1];

                        /* need to reduce the indices by 1 because array indices start at 0, obj starts at 1  */
                        if( pf.m_aNormalIndices[vertexIndex] > 0 )
                        {
                            --pf.m_aNormalIndices[vertexIndex];
                        }
                    }

                    /* need to reduce the indices by 1 because array indices start at 0, obj starts at 1  */
                    if( pf.m_aVertexIndices[vertexIndex] > 0 )
                    {
                        --pf.m_aVertexIndices[vertexIndex];
                    }

                    vertexIndex++;
                }
            }


            CC.ASSERT( ii >= vertexIndex );
            pf.m_iVertexCount = vertexIndex;
            ++fc;
        }
    }

    return pMesh;
};
